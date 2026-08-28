-- Script SQL para Supabase: Ampliar perfiles, Leaderboard y estadísticas de Free Fire

-- 1. Ampliar tabla 'profiles' para almacenar metadatos avanzados de Free Fire
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS freefire_level integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freefire_likes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freefire_rank integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clan_name text,
  ADD COLUMN IF NOT EXISTS signature text;

-- 2. Crear tabla 'leaderboard' para el ranking general de la arena basado en estadísticas reales
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  wins integer DEFAULT 0,
  kills integer DEFAULT 0,
  damage numeric DEFAULT 0,
  points integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS en leaderboard
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on leaderboard" ON public.leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Enable insert/update for authenticated users on leaderboard" ON public.leaderboard
  FOR ALL USING (auth.role() = 'authenticated');
