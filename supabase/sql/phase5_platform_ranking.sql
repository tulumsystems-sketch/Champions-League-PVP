-- Fase 5: ranking, perfil e historial de la arena (no de la carrera de Free Fire).
--
-- leaderboard = métricas de esta plataforma (victorias, participaciones, Coins ganadas, puntos).
-- player_stats.wins / ranking_points / coins_won = mismas métricas de plataforma.
-- player_stats.ff_wins / ff_ranking_points + kills/damage/headshots/matches_played = carrera FF (identidad).
--
-- Puntos: victoria de sala +25; desafío 1º +25, 2º +15, 3º +10.
-- Participaciones: salas completed + desafíos completed (no cancelados).

ALTER TABLE public.player_stats
  ADD COLUMN IF NOT EXISTS ff_wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ff_ranking_points integer NOT NULL DEFAULT 0;

ALTER TABLE public.leaderboard
  ADD COLUMN IF NOT EXISTS participations integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coins_won integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.protect_platform_player_stats()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.wins := OLD.wins;
      NEW.ranking_points := OLD.ranking_points;
      NEW.coins_won := OLD.coins_won;
    ELSE
      NEW.wins := 0;
      NEW.ranking_points := 0;
      NEW.coins_won := 0;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_platform_player_stats ON public.player_stats;
CREATE TRIGGER trg_protect_platform_player_stats
  BEFORE INSERT OR UPDATE ON public.player_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_platform_player_stats();

CREATE OR REPLACE FUNCTION public.refresh_platform_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_nick text;
  v_room_played integer := 0;
  v_room_wins integer := 0;
  v_chal_played integer := 0;
  v_chal_first integer := 0;
  v_chal_second integer := 0;
  v_chal_third integer := 0;
  v_wins integer;
  v_parts integer;
  v_points integer;
  v_coins integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(NULLIF(btrim(nickname), ''), 'Jugador')
    INTO v_nick
    FROM public.profiles
    WHERE id = p_user_id;
  IF v_nick IS NULL THEN
    v_nick := 'Jugador';
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE mr.status = 'completed'),
    COUNT(*) FILTER (WHERE mr.status = 'completed' AND mrp.team = mr.winner_team)
  INTO v_room_played, v_room_wins
  FROM public.match_room_players mrp
  JOIN public.match_rooms mr ON mr.id = mrp.room_id
  WHERE mrp.user_id = p_user_id;

  SELECT
    COUNT(*) FILTER (WHERE c.status = 'completed'),
    COUNT(*) FILTER (WHERE c.status = 'completed' AND cp.position = 1),
    COUNT(*) FILTER (WHERE c.status = 'completed' AND cp.position = 2),
    COUNT(*) FILTER (WHERE c.status = 'completed' AND cp.position = 3)
  INTO v_chal_played, v_chal_first, v_chal_second, v_chal_third
  FROM public.challenge_participants cp
  JOIN public.challenges c ON c.id = cp.challenge_id
  WHERE cp.user_id = p_user_id;

  v_wins := COALESCE(v_room_wins, 0) + COALESCE(v_chal_first, 0);
  v_parts := COALESCE(v_room_played, 0) + COALESCE(v_chal_played, 0);
  v_points :=
    (COALESCE(v_room_wins, 0) * 25)
    + (COALESCE(v_chal_first, 0) * 25)
    + (COALESCE(v_chal_second, 0) * 15)
    + (COALESCE(v_chal_third, 0) * 10);

  SELECT COALESCE(SUM(wt.amount), 0)::integer
    INTO v_coins
    FROM public.wallet_transactions wt
    JOIN public.wallets w ON w.id = wt.wallet_id
    WHERE w.user_id = p_user_id
      AND wt.type = 'credit'
      AND wt.reference_type IN ('room', 'challenge')
      AND COALESCE(wt.description, '') NOT ILIKE 'Reembolso%';

  IF v_parts = 0 AND v_wins = 0 AND v_points = 0 AND COALESCE(v_coins, 0) = 0 THEN
    DELETE FROM public.leaderboard WHERE user_id = p_user_id;
    UPDATE public.player_stats
      SET wins = 0, ranking_points = 0, coins_won = 0, updated_at = now()
      WHERE user_id = p_user_id;
    RETURN;
  END IF;

  INSERT INTO public.player_stats (user_id, wins, ranking_points, coins_won, updated_at)
  VALUES (p_user_id, v_wins, v_points, COALESCE(v_coins, 0), now())
  ON CONFLICT (user_id) DO UPDATE SET
    wins = EXCLUDED.wins,
    ranking_points = EXCLUDED.ranking_points,
    coins_won = EXCLUDED.coins_won,
    updated_at = now();

  INSERT INTO public.leaderboard (
    user_id, nickname, wins, kills, damage, points, participations, coins_won, updated_at
  ) VALUES (
    p_user_id, v_nick, v_wins, 0, 0, v_points, v_parts, COALESCE(v_coins, 0), now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    wins = EXCLUDED.wins,
    kills = 0,
    damage = 0,
    points = EXCLUDED.points,
    participations = EXCLUDED.participations,
    coins_won = EXCLUDED.coins_won,
    updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_platform_rank(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid := COALESCE(p_user_id, auth.uid());
  v_row public.leaderboard;
  v_rank integer;
  v_nick text;
BEGIN
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Tenés que iniciar sesión.';
  END IF;

  SELECT * INTO v_row FROM public.leaderboard WHERE user_id = v_id;
  IF NOT FOUND THEN
    SELECT COALESCE(NULLIF(btrim(nickname), ''), 'Jugador') INTO v_nick
    FROM public.profiles WHERE id = v_id;
    RETURN jsonb_build_object(
      'rank', NULL,
      'wins', 0,
      'participations', 0,
      'coinsWon', 0,
      'points', 0,
      'nickname', COALESCE(v_nick, 'Jugador')
    );
  END IF;

  SELECT COUNT(*)::integer + 1 INTO v_rank
  FROM public.leaderboard o
  WHERE o.points > v_row.points
     OR (o.points = v_row.points AND o.wins > v_row.wins)
     OR (o.points = v_row.points AND o.wins = v_row.wins AND COALESCE(o.coins_won, 0) > COALESCE(v_row.coins_won, 0))
     OR (o.points = v_row.points AND o.wins = v_row.wins AND COALESCE(o.coins_won, 0) = COALESCE(v_row.coins_won, 0) AND o.nickname < v_row.nickname)
     OR (o.points = v_row.points AND o.wins = v_row.wins AND COALESCE(o.coins_won, 0) = COALESCE(v_row.coins_won, 0) AND o.nickname = v_row.nickname AND o.user_id < v_row.user_id);

  RETURN jsonb_build_object(
    'rank', v_rank,
    'wins', COALESCE(v_row.wins, 0),
    'participations', COALESCE(v_row.participations, 0),
    'coinsWon', COALESCE(v_row.coins_won, 0),
    'points', COALESCE(v_row.points, 0),
    'nickname', v_row.nickname
  );
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
    SELECT user_id FROM public.match_room_players
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
  END LOOP;

  FOR rec IN SELECT user_id FROM public.match_room_players WHERE room_id = p_room_id LOOP
    PERFORM public.refresh_platform_stats(rec.user_id);
  END LOOP;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.close_challenge(p_challenge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_challenge public.challenges;
  v_count integer;
  v_pot integer;
  v_paid jsonb := '[]'::jsonb;
  rec record;
  i integer := 0;
  v_prize integer;
  v_first integer;
  v_second integer;
  v_third integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede cerrar desafíos.';
  END IF;

  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Desafío no encontrado.';
  END IF;
  IF v_challenge.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Este desafío ya está cerrado.';
  END IF;

  SELECT count(*) INTO v_count FROM public.challenge_participants WHERE challenge_id = p_challenge_id;

  IF v_count < 2 THEN
    FOR rec IN SELECT * FROM public.challenge_participants WHERE challenge_id = p_challenge_id LOOP
      IF v_challenge.entry_fee > 0 THEN
        PERFORM public.apply_wallet_credit(rec.user_id, v_challenge.entry_fee, 'Reembolso desafío cancelado', 'challenge', p_challenge_id);
      END IF;
    END LOOP;
    UPDATE public.challenges
      SET status = 'cancelled', closed_at = now(), closed_by = auth.uid()
      WHERE id = p_challenge_id;
    RETURN jsonb_build_object('status', 'cancelled', 'reason', 'less_than_two', 'refunded', v_count);
  END IF;

  v_pot := (v_count * v_challenge.entry_fee * 9) / 10;
  IF v_count = 2 THEN
    v_first := (v_pot * 7) / 10;
    v_second := v_pot - v_first;
    v_third := 0;
  ELSE
    v_first := (v_pot * 5) / 10;
    v_second := (v_pot * 3) / 10;
    v_third := v_pot - v_first - v_second;
  END IF;

  FOR rec IN
    SELECT * FROM public.challenge_participants
    WHERE challenge_id = p_challenge_id
    ORDER BY score DESC, joined_at ASC
  LOOP
    i := i + 1;
    v_prize := 0;
    IF i = 1 THEN v_prize := v_first;
    ELSIF i = 2 THEN v_prize := v_second;
    ELSIF i = 3 THEN v_prize := v_third;
    END IF;

    UPDATE public.challenge_participants
      SET position = i, prize_coins = v_prize
      WHERE id = rec.id;

    IF v_prize > 0 THEN
      PERFORM public.apply_wallet_credit(
        rec.user_id,
        v_prize,
        'Premio desafío puesto ' || i,
        'challenge',
        p_challenge_id
      );
    END IF;

    v_paid := v_paid || jsonb_build_array(jsonb_build_object(
      'user_id', rec.user_id,
      'place', i,
      'prize', v_prize,
      'score', rec.score
    ));
  END LOOP;

  UPDATE public.challenges
    SET status = 'completed', closed_at = now(), closed_by = auth.uid()
    WHERE id = p_challenge_id;

  FOR rec IN SELECT user_id FROM public.challenge_participants WHERE challenge_id = p_challenge_id LOOP
    PERFORM public.refresh_platform_stats(rec.user_id);
  END LOOP;

  RETURN jsonb_build_object('status', 'completed', 'pot', v_pot, 'paid', v_paid);
END;
$function$;

DROP POLICY IF EXISTS "Enable insert/update for authenticated users on leaderboard" ON public.leaderboard;

REVOKE ALL ON FUNCTION public.refresh_platform_stats(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_platform_player_stats() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_platform_rank(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_rank(uuid) TO authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id FROM public.match_room_players
    UNION
    SELECT DISTINCT cp.user_id
    FROM public.challenge_participants cp
    JOIN public.challenges c ON c.id = cp.challenge_id
    WHERE c.status = 'completed'
  LOOP
    PERFORM public.refresh_platform_stats(r.user_id);
  END LOOP;

  DELETE FROM public.leaderboard
  WHERE COALESCE(participations, 0) = 0
    AND COALESCE(wins, 0) = 0
    AND COALESCE(points, 0) = 0
    AND COALESCE(coins_won, 0) = 0;
END $$;
