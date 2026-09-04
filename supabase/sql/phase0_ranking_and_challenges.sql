-- Fase 0: índices de upsert, lectura de desafíos upcoming y seed de torneos.
-- Idempotente. Ejecutar en SQL Editor si se recrea el entorno.

CREATE UNIQUE INDEX IF NOT EXISTS player_stats_user_id_key ON public.player_stats (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_user_id_key ON public.leaderboard (user_id);

DROP POLICY IF EXISTS "Authenticated users can read active challenges" ON public.challenges;
DROP POLICY IF EXISTS "Authenticated users can read published challenges" ON public.challenges;
CREATE POLICY "Authenticated users can read published challenges"
  ON public.challenges
  FOR SELECT
  TO authenticated
  USING (status IN ('active', 'upcoming', 'completed', 'cancelled'));
