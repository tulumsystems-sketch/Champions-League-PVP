-- Phase 4: Storage + resultados de sala + admin de conflictos.
-- El premio NO se paga por honor del jugador: hay que subir captura y un admin cierra.

-- Estados extra de sala
ALTER TABLE public.match_rooms DROP CONSTRAINT IF EXISTS match_rooms_status_check;
ALTER TABLE public.match_rooms
  ADD CONSTRAINT match_rooms_status_check
  CHECK (status = ANY (ARRAY[
    'waiting'::text,
    'in_progress'::text,
    'pending_review'::text,
    'disputed'::text,
    'completed'::text,
    'cancelled'::text
  ]));

CREATE TABLE IF NOT EXISTS public.match_room_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.match_rooms(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  claimed_winner_team text NOT NULL CHECK (claimed_winner_team = ANY (ARRAY['a'::text, 'b'::text])),
  evidence_url text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, submitted_by)
);

CREATE INDEX IF NOT EXISTS match_room_results_room_idx
  ON public.match_room_results (room_id, status);

ALTER TABLE public.match_room_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read match results" ON public.match_room_results;
CREATE POLICY "Authenticated can read match results"
  ON public.match_room_results
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON public.match_room_results TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.match_room_results FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('match-evidence', 'match-evidence', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('deposit-receipts', 'deposit-receipts', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "match_evidence_insert" ON storage.objects;
CREATE POLICY "match_evidence_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'match-evidence'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "match_evidence_update" ON storage.objects;
CREATE POLICY "match_evidence_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'match-evidence'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    bucket_id = 'match-evidence'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "match_evidence_select" ON storage.objects;
CREATE POLICY "match_evidence_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'match-evidence'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      OR public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.match_room_players p
        WHERE p.user_id = auth.uid()
          AND p.room_id::text = (storage.foldername(name))[2]
      )
    )
  );

DROP POLICY IF EXISTS "deposit_receipts_insert" ON storage.objects;
CREATE POLICY "deposit_receipts_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'deposit-receipts'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "deposit_receipts_update" ON storage.objects;
CREATE POLICY "deposit_receipts_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'deposit-receipts'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    bucket_id = 'deposit-receipts'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "deposit_receipts_select" ON storage.objects;
CREATE POLICY "deposit_receipts_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'deposit-receipts'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      OR public.is_admin()
    )
  );

CREATE OR REPLACE FUNCTION public.refresh_room_claim_status(p_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
  v_pending integer;
  v_teams integer;
BEGIN
  SELECT status INTO v_status FROM public.match_rooms WHERE id = p_room_id FOR UPDATE;
  IF v_status IS NULL OR v_status NOT IN ('in_progress', 'pending_review', 'disputed') THEN
    RETURN;
  END IF;

  SELECT count(*), count(DISTINCT claimed_winner_team)
    INTO v_pending, v_teams
  FROM public.match_room_results
  WHERE room_id = p_room_id AND status = 'pending';

  IF v_pending = 0 THEN
    UPDATE public.match_rooms
      SET status = 'in_progress'
      WHERE id = p_room_id AND status IN ('pending_review', 'disputed');
  ELSIF v_teams > 1 THEN
    UPDATE public.match_rooms SET status = 'disputed' WHERE id = p_room_id;
  ELSE
    UPDATE public.match_rooms SET status = 'pending_review' WHERE id = p_room_id;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.settle_match_room_payout(p_room_id uuid, p_winner_team text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_room public.match_rooms;
  v_count integer;
  v_winners integer;
  v_pot integer;
  v_share integer;
  v_rest integer;
  v_first boolean := true;
  rec record;
  v_amount integer;
BEGIN
  IF p_winner_team NOT IN ('a', 'b') THEN
    RAISE EXCEPTION 'El ganador tiene que ser el equipo A o B.';
  END IF;

  SELECT * INTO v_room FROM public.match_rooms WHERE id = p_room_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sala no encontrada.';
  END IF;
  IF v_room.status NOT IN ('in_progress', 'pending_review', 'disputed') THEN
    RAISE EXCEPTION 'La sala no está lista para cerrar.';
  END IF;

  SELECT count(*) INTO v_count FROM public.match_room_players WHERE room_id = p_room_id;
  IF v_count <> public.room_capacity(v_room.mode) THEN
    RAISE EXCEPTION 'La sala todavía no está completa.';
  END IF;

  SELECT count(*) INTO v_winners
  FROM public.match_room_players
  WHERE room_id = p_room_id AND team = p_winner_team;
  IF v_winners < 1 THEN
    RAISE EXCEPTION 'Ese equipo no tiene jugadores.';
  END IF;

  v_pot := (v_count * v_room.entry_fee * 9) / 10;
  v_share := v_pot / v_winners;
  v_rest := v_pot - (v_share * v_winners);

  UPDATE public.match_rooms
    SET status = 'completed',
        winner_team = p_winner_team,
        prize = v_pot,
        winner_id = (
          SELECT user_id FROM public.match_room_players
          WHERE room_id = p_room_id AND team = p_winner_team
          ORDER BY joined_at ASC
          LIMIT 1
        )
    WHERE id = p_room_id;

  UPDATE public.match_room_results
    SET status = CASE WHEN claimed_winner_team = p_winner_team THEN 'approved' ELSE 'rejected' END,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE room_id = p_room_id AND status = 'pending';

  FOR rec IN
    SELECT user_id, nickname FROM public.match_room_players
    WHERE room_id = p_room_id AND team = p_winner_team
    ORDER BY joined_at ASC
  LOOP
    v_amount := v_share;
    IF v_first THEN
      v_amount := v_amount + v_rest;
      v_first := false;
    END IF;

    PERFORM public.apply_wallet_credit(
      rec.user_id,
      v_amount,
      'Premio sala ' || v_room.mode || ' equipo ' || upper(p_winner_team),
      'room',
      v_room.id
    );

    INSERT INTO public.leaderboard (user_id, nickname, wins, kills, damage, points, updated_at)
    VALUES (rec.user_id, rec.nickname, 1, 0, 0, 25, now())
    ON CONFLICT (user_id) DO UPDATE SET
      nickname = EXCLUDED.nickname,
      wins = public.leaderboard.wins + 1,
      points = public.leaderboard.points + 25,
      updated_at = now();

    UPDATE public.player_stats
      SET wins = COALESCE(wins, 0) + 1,
          ranking_points = COALESCE(ranking_points, 0) + 25,
          coins_won = COALESCE(coins_won, 0) + v_amount,
          updated_at = now()
      WHERE user_id = rec.user_id;
  END LOOP;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_match_result(
  p_room_id uuid,
  p_claimed_winner_team text,
  p_evidence_url text,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_room public.match_rooms;
  v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Tenés que iniciar sesión.';
  END IF;
  IF p_claimed_winner_team NOT IN ('a', 'b') THEN
    RAISE EXCEPTION 'El ganador tiene que ser el equipo A o B.';
  END IF;
  IF p_evidence_url IS NULL OR length(trim(p_evidence_url)) < 12 OR p_evidence_url !~* '^https?://' THEN
    RAISE EXCEPTION 'Tenés que adjuntar una captura válida.';
  END IF;

  SELECT * INTO v_room FROM public.match_rooms WHERE id = p_room_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sala no encontrada.';
  END IF;
  IF v_room.status NOT IN ('in_progress', 'pending_review', 'disputed') THEN
    RAISE EXCEPTION 'La sala no está en juego.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.match_room_players WHERE room_id = p_room_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Solo los participantes pueden enviar el resultado.';
  END IF;

  SELECT count(*) INTO v_count FROM public.match_room_players WHERE room_id = p_room_id;
  IF v_count <> public.room_capacity(v_room.mode) THEN
    RAISE EXCEPTION 'La sala todavía no está completa.';
  END IF;

  INSERT INTO public.match_room_results (
    room_id, submitted_by, claimed_winner_team, evidence_url, notes, status
  ) VALUES (
    p_room_id, auth.uid(), p_claimed_winner_team, trim(p_evidence_url), NULLIF(trim(p_notes), ''), 'pending'
  )
  ON CONFLICT (room_id, submitted_by) DO UPDATE SET
    claimed_winner_team = EXCLUDED.claimed_winner_team,
    evidence_url = EXCLUDED.evidence_url,
    notes = EXCLUDED.notes,
    status = 'pending',
    reviewed_by = NULL,
    reviewed_at = NULL;

  PERFORM public.refresh_room_claim_status(p_room_id);
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_match_room(p_room_id uuid, p_winner_team text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un admin puede cerrar la sala y pagar el premio.';
  END IF;
  RETURN public.settle_match_room_payout(p_room_id, p_winner_team);
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_match_result(p_result_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result public.match_room_results;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un admin puede aprobar resultados.';
  END IF;

  SELECT * INTO v_result FROM public.match_room_results WHERE id = p_result_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reclamo no encontrado.';
  END IF;
  IF v_result.status <> 'pending' THEN
    RAISE EXCEPTION 'Ese reclamo ya fue revisado.';
  END IF;

  RETURN public.settle_match_room_payout(v_result.room_id, v_result.claimed_winner_team);
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_match_result(p_result_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result public.match_room_results;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un admin puede rechazar capturas.';
  END IF;

  SELECT * INTO v_result FROM public.match_room_results WHERE id = p_result_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reclamo no encontrado.';
  END IF;
  IF v_result.status <> 'pending' THEN
    RAISE EXCEPTION 'Ese reclamo ya fue revisado.';
  END IF;

  UPDATE public.match_room_results
    SET status = 'rejected',
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = p_result_id;

  PERFORM public.refresh_room_claim_status(v_result.room_id);
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_match_room(p_room_id uuid, p_winner_team text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un admin puede resolver el conflicto.';
  END IF;
  RETURN public.settle_match_room_payout(p_room_id, p_winner_team);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_void_match_room(p_room_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_room public.match_rooms;
  rec record;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un admin puede anular la sala.';
  END IF;

  SELECT * INTO v_room FROM public.match_rooms WHERE id = p_room_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sala no encontrada.';
  END IF;
  IF v_room.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Esa sala ya está cerrada.';
  END IF;

  FOR rec IN SELECT user_id FROM public.match_room_players WHERE room_id = p_room_id LOOP
    PERFORM public.apply_wallet_credit(rec.user_id, v_room.entry_fee, 'Reembolso por anulación admin', 'room', v_room.id);
  END LOOP;

  UPDATE public.match_room_results
    SET status = 'rejected',
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE room_id = p_room_id AND status = 'pending';

  UPDATE public.match_rooms SET status = 'cancelled' WHERE id = p_room_id;
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.refresh_room_claim_status(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_match_room_payout(uuid, text) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.submit_match_result(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_match_room(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_match_result(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_match_result(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolve_match_room(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_void_match_room(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.submit_match_result(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_match_room(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_match_result(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_match_result(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_match_room(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_void_match_room(uuid) TO authenticated;
