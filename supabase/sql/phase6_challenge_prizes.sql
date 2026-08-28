-- Fase 6: premios de desafío configurables (ejemplo PRD 50/30/10) y métrica "puntos".
-- Ya no se reparte el 90% del pozo. El admin carga 1º / 2º / 3º al crear el desafío.
-- Menos de 2 inscriptos: reembolso y cancelled (igual que antes).

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS prize_first integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS prize_second integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS prize_third integer NOT NULL DEFAULT 10;

ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_prize_first_check,
  DROP CONSTRAINT IF EXISTS challenges_prize_second_check,
  DROP CONSTRAINT IF EXISTS challenges_prize_third_check;

ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_prize_first_check CHECK (prize_first >= 0),
  ADD CONSTRAINT challenges_prize_second_check CHECK (prize_second >= 0),
  ADD CONSTRAINT challenges_prize_third_check CHECK (prize_third >= 0);

UPDATE public.challenges
  SET prize_first = 50, prize_second = 30, prize_third = 10
  WHERE prize_first IS NULL OR prize_second IS NULL OR prize_third IS NULL;

DROP FUNCTION IF EXISTS public.create_challenge(text, text, text, integer, timestamp with time zone, timestamp with time zone, integer, text);
DROP FUNCTION IF EXISTS public.update_challenge(uuid, text, text, text, integer, timestamp with time zone, timestamp with time zone, integer, text);

CREATE OR REPLACE FUNCTION public.create_challenge(
  p_title text,
  p_description text,
  p_metric text,
  p_entry_fee integer,
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone,
  p_max_players integer,
  p_status text,
  p_prize_first integer DEFAULT 50,
  p_prize_second integer DEFAULT 30,
  p_prize_third integer DEFAULT 10
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede crear desafíos.';
  END IF;
  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'El título es obligatorio.';
  END IF;
  IF p_metric NOT IN ('points', 'wins', 'kills', 'damage', 'headshots') THEN
    RAISE EXCEPTION 'Métrica inválida.';
  END IF;
  IF p_entry_fee IS NULL OR p_entry_fee < 0 THEN
    RAISE EXCEPTION 'La entrada no puede ser negativa.';
  END IF;
  IF COALESCE(p_prize_first, 0) < 0 OR COALESCE(p_prize_second, 0) < 0 OR COALESCE(p_prize_third, 0) < 0 THEN
    RAISE EXCEPTION 'Los premios no pueden ser negativos.';
  END IF;
  IF COALESCE(p_prize_first, 0) + COALESCE(p_prize_second, 0) + COALESCE(p_prize_third, 0) <= 0 THEN
    RAISE EXCEPTION 'Tenés que cargar al menos un premio.';
  END IF;
  IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date <= p_start_date THEN
    RAISE EXCEPTION 'Las fechas tienen que ser válidas (cierre posterior al inicio).';
  END IF;
  IF p_status NOT IN ('active', 'upcoming') THEN
    RAISE EXCEPTION 'El estado inicial tiene que ser active o upcoming.';
  END IF;
  IF p_max_players IS NOT NULL AND p_max_players < 2 THEN
    RAISE EXCEPTION 'El cupo mínimo es 2 jugadores.';
  END IF;

  INSERT INTO public.challenges (
    title, description, metric, entry_fee, start_date, end_date, max_players, status,
    prize_first, prize_second, prize_third
  ) VALUES (
    btrim(p_title), nullif(btrim(p_description), ''), p_metric, p_entry_fee, p_start_date, p_end_date, p_max_players, p_status,
    COALESCE(p_prize_first, 50), COALESCE(p_prize_second, 30), COALESCE(p_prize_third, 10)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_challenge(
  p_challenge_id uuid,
  p_title text,
  p_description text,
  p_metric text,
  p_entry_fee integer,
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone,
  p_max_players integer,
  p_status text,
  p_prize_first integer DEFAULT 50,
  p_prize_second integer DEFAULT 30,
  p_prize_third integer DEFAULT 10
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede editar desafíos.';
  END IF;
  SELECT status INTO v_status FROM public.challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Desafío no encontrado.';
  END IF;
  IF v_status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'No se puede editar un desafío cerrado.';
  END IF;
  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'El título es obligatorio.';
  END IF;
  IF p_metric NOT IN ('points', 'wins', 'kills', 'damage', 'headshots') THEN
    RAISE EXCEPTION 'Métrica inválida.';
  END IF;
  IF p_entry_fee IS NULL OR p_entry_fee < 0 THEN
    RAISE EXCEPTION 'La entrada no puede ser negativa.';
  END IF;
  IF COALESCE(p_prize_first, 0) < 0 OR COALESCE(p_prize_second, 0) < 0 OR COALESCE(p_prize_third, 0) < 0 THEN
    RAISE EXCEPTION 'Los premios no pueden ser negativos.';
  END IF;
  IF COALESCE(p_prize_first, 0) + COALESCE(p_prize_second, 0) + COALESCE(p_prize_third, 0) <= 0 THEN
    RAISE EXCEPTION 'Tenés que cargar al menos un premio.';
  END IF;
  IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date <= p_start_date THEN
    RAISE EXCEPTION 'Las fechas tienen que ser válidas (cierre posterior al inicio).';
  END IF;
  IF p_status NOT IN ('active', 'upcoming') THEN
    RAISE EXCEPTION 'El estado tiene que ser active o upcoming.';
  END IF;

  UPDATE public.challenges SET
    title = btrim(p_title),
    description = nullif(btrim(p_description), ''),
    metric = p_metric,
    entry_fee = p_entry_fee,
    start_date = p_start_date,
    end_date = p_end_date,
    max_players = p_max_players,
    status = p_status,
    prize_first = COALESCE(p_prize_first, 50),
    prize_second = COALESCE(p_prize_second, 30),
    prize_third = COALESCE(p_prize_third, 10)
  WHERE id = p_challenge_id;
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

  v_first := COALESCE(v_challenge.prize_first, 50);
  v_second := COALESCE(v_challenge.prize_second, 30);
  v_third := COALESCE(v_challenge.prize_third, 10);
  v_pot := v_first + v_second + v_third;

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

REVOKE ALL ON FUNCTION public.create_challenge(text, text, text, integer, timestamp with time zone, timestamp with time zone, integer, text, integer, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_challenge(text, text, text, integer, timestamp with time zone, timestamp with time zone, integer, text, integer, integer, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.update_challenge(uuid, text, text, text, integer, timestamp with time zone, timestamp with time zone, integer, text, integer, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_challenge(uuid, text, text, text, integer, timestamp with time zone, timestamp with time zone, integer, text, integer, integer, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.close_challenge(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_challenge(uuid) TO authenticated;
