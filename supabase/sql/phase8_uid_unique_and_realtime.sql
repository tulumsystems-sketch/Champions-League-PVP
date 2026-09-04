-- Fase 8: UID de Free Fire único y publicación Realtime.
-- Un jugador no puede reutilizar el UID de otro.
-- Salas, desafíos, ranking y wallet se actualizan en vivo en el cliente.

CREATE UNIQUE INDEX IF NOT EXISTS profiles_freefire_uid_unique
  ON public.profiles (freefire_uid)
  WHERE freefire_uid IS NOT NULL AND btrim(freefire_uid) <> '';

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'match_rooms',
    'match_room_players',
    'match_room_results',
    'challenges',
    'challenge_participants',
    'leaderboard',
    'wallets',
    'wallet_transactions',
    'deposit_requests',
    'withdrawal_requests'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
