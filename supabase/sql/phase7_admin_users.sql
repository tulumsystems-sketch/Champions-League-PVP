-- Fase 7: admin de usuarios (listado, UID, saldo, activar/suspender)
-- y ajuste manual de Coins / premios (conflicto o error, no solo el cierre automático).
--
-- RPCs (SECURITY DEFINER):
--   admin_list_users(p_search)
--   admin_set_user_status(p_user_id, p_status)
--   admin_adjust_coins(p_user_id, p_amount, p_reason, p_count_as_prize)
--
-- reference_type = 'prize' entra al ranking (Coins ganadas).
-- reference_type = 'admin' solo mueve el wallet.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IS NULL OR status IN ('active', 'suspended'));

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.assert_active_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Tenés que iniciar sesión.';
  END IF;

  SELECT COALESCE(status, 'active') INTO v_status
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No encontramos tu perfil.';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'Tu cuenta está suspendida. Contactá a un administrador.';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_wallet_debit(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet public.wallets;
  v_next numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a 0.';
  END IF;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El jugador no tiene wallet.';
  END IF;
  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'El saldo no alcanza para este descuento.';
  END IF;

  v_next := v_wallet.balance - p_amount;
  UPDATE public.wallets SET balance = v_next WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (wallet_id, type, amount, description, reference_type, reference_id)
  VALUES (v_wallet.id, 'debit', p_amount, p_description, p_reference_type, p_reference_id);

  RETURN v_next;
END;
$function$;

CREATE OR REPLACE FUNCTION public.debit_own_coins(
  p_amount numeric,
  p_description text,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Tenés que iniciar sesión.';
  END IF;
  PERFORM public.assert_active_account();
  RETURN public.apply_wallet_debit(auth.uid(), p_amount, p_description, p_reference_type, p_reference_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.join_challenge(p_challenge_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_challenge public.challenges;
  v_id uuid;
  v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Tenés que iniciar sesión.';
  END IF;
  PERFORM public.assert_active_account();

  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF NOT FOUND OR v_challenge.status <> 'active' THEN
    RAISE EXCEPTION 'Este desafío no está disponible para inscripción.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND freefire_uid IS NOT NULL AND btrim(freefire_uid) <> ''
  ) THEN
    RAISE EXCEPTION 'Completá tu UID de Free Fire antes de inscribirte.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.challenge_participants
    WHERE challenge_id = p_challenge_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Ya estás inscripto en este desafío.';
  END IF;

  IF v_challenge.max_players IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.challenge_participants WHERE challenge_id = p_challenge_id;
    IF v_count >= v_challenge.max_players THEN
      RAISE EXCEPTION 'El desafío está lleno.';
    END IF;
  END IF;

  INSERT INTO public.challenge_participants (challenge_id, user_id, score)
  VALUES (p_challenge_id, auth.uid(), 0)
  RETURNING id INTO v_id;

  IF v_challenge.entry_fee > 0 THEN
    PERFORM public.debit_own_coins(
      v_challenge.entry_fee,
      'Inscripción a ' || v_challenge.title,
      'challenge',
      p_challenge_id
    );
  END IF;

  PERFORM public.refresh_challenge_positions(p_challenge_id);
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_match_room(p_mode text, p_entry_fee integer, p_room_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_name text;
  v_id uuid;
  v_prize integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Tenés que iniciar sesión.';
  END IF;
  PERFORM public.assert_active_account();
  IF p_mode NOT IN ('1v1', '2v2', '3v3', '4v4') THEN
    RAISE EXCEPTION 'Modalidad inválida.';
  END IF;
  IF p_entry_fee NOT IN (1, 10, 15, 50) THEN
    RAISE EXCEPTION 'La entrada tiene que ser 1, 10, 15 o 50 Coins.';
  END IF;

  SELECT COALESCE(NULLIF(btrim(nickname), ''), 'Jugador') INTO v_name FROM public.profiles WHERE id = auth.uid();
  v_prize := public.room_team_prize(p_entry_fee, p_mode);

  INSERT INTO public.match_rooms (creator_id, creator_name, mode, entry_fee, prize, status, room_code)
  VALUES (
    auth.uid(),
    v_name,
    p_mode,
    p_entry_fee,
    v_prize,
    'waiting',
    COALESCE(nullif(trim(p_room_code), ''), 'FF-' || floor(10000 + random() * 90000)::int)
  )
  RETURNING id INTO v_id;

  INSERT INTO public.match_room_players (room_id, user_id, team, nickname)
  VALUES (v_id, auth.uid(), 'a', v_name);

  PERFORM public.debit_own_coins(p_entry_fee, 'Crear sala ' || p_mode, 'room', v_id);
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.join_match_room(p_room_id uuid, p_team text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_room public.match_rooms;
  v_name text;
  v_size integer;
  v_capacity integer;
  v_team_count integer;
  v_total integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Tenés que iniciar sesión.';
  END IF;
  PERFORM public.assert_active_account();
  IF p_team NOT IN ('a', 'b') THEN
    RAISE EXCEPTION 'Elegí equipo A o B.';
  END IF;

  SELECT * INTO v_room FROM public.match_rooms WHERE id = p_room_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sala no encontrada.';
  END IF;
  IF v_room.status <> 'waiting' THEN
    RAISE EXCEPTION 'Esta sala ya no está disponible.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.match_room_players WHERE room_id = p_room_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Ya estás en esta sala.';
  END IF;

  v_size := public.room_team_size(v_room.mode);
  v_capacity := public.room_capacity(v_room.mode);
  IF v_size < 1 THEN
    RAISE EXCEPTION 'Modalidad inválida.';
  END IF;

  SELECT count(*) INTO v_team_count FROM public.match_room_players WHERE room_id = p_room_id AND team = p_team;
  IF v_team_count >= v_size THEN
    RAISE EXCEPTION 'Ese equipo está completo.';
  END IF;

  SELECT COALESCE(NULLIF(btrim(nickname), ''), 'Jugador') INTO v_name FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.match_room_players (room_id, user_id, team, nickname)
  VALUES (p_room_id, auth.uid(), p_team, v_name);

  PERFORM public.debit_own_coins(v_room.entry_fee, 'Entrar a sala ' || v_room.mode, 'room', v_room.id);

  SELECT count(*) INTO v_total FROM public.match_room_players WHERE room_id = p_room_id;
  IF v_total >= v_capacity THEN
    UPDATE public.match_rooms
      SET status = 'in_progress',
          prize = public.room_team_prize(v_room.entry_fee, v_room.mode),
          opponent_id = CASE WHEN p_team = 'b' THEN auth.uid() ELSE opponent_id END,
          opponent_name = CASE WHEN p_team = 'b' THEN v_name ELSE opponent_name END
      WHERE id = p_room_id;
  ELSIF p_team = 'b' THEN
    UPDATE public.match_rooms SET opponent_id = auth.uid(), opponent_name = v_name WHERE id = p_room_id;
  END IF;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(p_package_id uuid, p_method text, p_payout_details text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.coin_packages;
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Tenés que iniciar sesión.';
  END IF;
  PERFORM public.assert_active_account();

  SELECT * INTO v_pkg FROM public.coin_packages WHERE id = p_package_id AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan de retiro no válido.';
  END IF;
  IF p_payout_details IS NULL OR length(trim(p_payout_details)) < 6 THEN
    RAISE EXCEPTION 'Completá los datos de cobro (CBU/alias o wallet USDT).';
  END IF;
  IF p_method NOT IN ('ars', 'usdt') THEN
    RAISE EXCEPTION 'Método inválido.';
  END IF;

  INSERT INTO public.withdrawal_requests (user_id, package_id, coins, amount_usd, method, payout_details, status)
  VALUES (auth.uid(), v_pkg.id, v_pkg.coins, v_pkg.price_usd, p_method, trim(p_payout_details), 'pending')
  RETURNING id INTO v_id;

  PERFORM public.debit_own_coins(v_pkg.coins, 'Solicitud de retiro: ' || v_pkg.coins || ' Coins', 'withdrawal', v_id);
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_suspended_deposit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
BEGIN
  SELECT COALESCE(status, 'active') INTO v_status
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF NOT FOUND OR v_status <> 'active' THEN
    RAISE EXCEPTION 'Tu cuenta está suspendida. Contactá a un administrador.';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prevent_suspended_deposit ON public.deposit_requests;
CREATE TRIGGER trg_prevent_suspended_deposit
  BEFORE INSERT ON public.deposit_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_suspended_deposit();

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

  SELECT GREATEST(COALESCE(SUM(
    CASE
      WHEN wt.type = 'credit'
        AND wt.reference_type IN ('room', 'challenge', 'prize')
        AND COALESCE(wt.description, '') NOT ILIKE 'Reembolso%'
        THEN wt.amount
      WHEN wt.type = 'debit' AND wt.reference_type = 'prize'
        THEN -wt.amount
      ELSE 0
    END
  ), 0), 0)::integer
  INTO v_coins
  FROM public.wallet_transactions wt
  JOIN public.wallets w ON w.id = wt.wallet_id
  WHERE w.user_id = p_user_id;

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

CREATE OR REPLACE FUNCTION public.admin_list_users(p_search text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  email text,
  nickname text,
  freefire_uid text,
  role text,
  status text,
  balance numeric,
  coins_won integer,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_q text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede ver el listado de jugadores.';
  END IF;

  v_q := NULLIF(btrim(COALESCE(p_search, '')), '');
  IF v_q IS NOT NULL THEN
    v_q := replace(replace(v_q, '%', ''), '_', '');
    v_q := NULLIF(v_q, '');
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.nickname,
    p.freefire_uid,
    COALESCE(p.role, 'player'),
    COALESCE(p.status, 'active'),
    COALESCE(w.balance, 0),
    COALESCE(s.coins_won, 0),
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.wallets w ON w.user_id = p.id
  LEFT JOIN public.player_stats s ON s.user_id = p.id
  WHERE v_q IS NULL
    OR p.nickname ILIKE '%' || v_q || '%'
    OR p.email ILIKE '%' || v_q || '%'
    OR p.freefire_uid ILIKE '%' || v_q || '%'
  ORDER BY p.created_at DESC NULLS LAST
  LIMIT 200;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_user_status(p_user_id uuid, p_status text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_other_admins integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar el estado de un jugador.';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Jugador inválido.';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No podés cambiar el estado de tu propia cuenta.';
  END IF;
  IF p_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Estado inválido.';
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jugador no encontrado.';
  END IF;

  IF p_status = 'suspended' AND v_role = 'admin' THEN
    SELECT count(*) INTO v_other_admins
    FROM public.profiles
    WHERE role = 'admin'
      AND COALESCE(status, 'active') = 'active'
      AND id <> p_user_id;
    IF COALESCE(v_other_admins, 0) < 1 THEN
      RAISE EXCEPTION 'No podés suspender al último administrador activo.';
    END IF;
  END IF;

  UPDATE public.profiles SET status = p_status WHERE id = p_user_id;
  RETURN p_status;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_adjust_coins(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_count_as_prize boolean DEFAULT true
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_next numeric;
  v_desc text;
  v_ref text;
  v_reason text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede ajustar Coins.';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Jugador inválido.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Jugador no encontrado.';
  END IF;
  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'El ajuste no puede ser 0.';
  END IF;
  IF abs(p_amount) > 100000 THEN
    RAISE EXCEPTION 'El ajuste máximo es 100000 Coins.';
  END IF;

  v_reason := btrim(COALESCE(p_reason, ''));
  IF length(v_reason) < 8 THEN
    RAISE EXCEPTION 'Escribí el motivo (mínimo 8 caracteres).';
  END IF;

  v_ref := CASE WHEN COALESCE(p_count_as_prize, true) THEN 'prize' ELSE 'admin' END;
  v_desc := 'Ajuste admin: ' || v_reason;

  IF p_amount > 0 THEN
    v_next := public.apply_wallet_credit(p_user_id, p_amount::numeric, v_desc, v_ref, NULL);
  ELSE
    v_next := public.apply_wallet_debit(p_user_id, abs(p_amount)::numeric, v_desc, v_ref, NULL);
  END IF;

  PERFORM public.refresh_platform_stats(p_user_id);
  RETURN v_next;
END;
$function$;

REVOKE ALL ON FUNCTION public.assert_active_account() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_wallet_debit(uuid, numeric, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_suspended_deposit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_platform_stats(uuid) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.admin_list_users(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_user_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_adjust_coins(uuid, integer, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_coins(uuid, integer, text, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.debit_own_coins(numeric, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.debit_own_coins(numeric, text, text, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.join_challenge(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_challenge(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.create_match_room(text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_match_room(text, integer, text) TO authenticated;

REVOKE ALL ON FUNCTION public.join_match_room(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_match_room(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.request_withdrawal(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(uuid, text, text) TO authenticated;
