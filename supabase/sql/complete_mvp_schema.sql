-- Script SQL robusto para Supabase (Idempotente)
-- Puedes ejecutar este script completo en el SQL Editor de Supabase sin errores de duplicados.

-- 1. Tabla de Salas Privadas de Emparejamiento (match_rooms)
CREATE TABLE IF NOT EXISTS public.match_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_name text NOT NULL,
  mode text NOT NULL, -- '1v1', '2v2', '4v4'
  entry_fee integer NOT NULL DEFAULT 10,
  prize integer NOT NULL DEFAULT 18,
  status text NOT NULL DEFAULT 'waiting', -- 'waiting', 'in_progress', 'completed'
  room_code text,
  opponent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  opponent_name text,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS en match_rooms
ALTER TABLE public.match_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users on match_rooms" ON public.match_rooms;
CREATE POLICY "Enable read access for all users on match_rooms" ON public.match_rooms
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users on match_rooms" ON public.match_rooms;
CREATE POLICY "Enable insert for authenticated users on match_rooms" ON public.match_rooms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for participants and creators on match_rooms" ON public.match_rooms;
CREATE POLICY "Enable update for participants and creators on match_rooms" ON public.match_rooms
  FOR UPDATE USING (auth.role() = 'authenticated');


-- 2. Tabla de Leaderboard (Clasificación General)
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  nickname text NOT NULL,
  wins integer DEFAULT 0,
  kills integer DEFAULT 0,
  damage numeric DEFAULT 0,
  points integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS en leaderboard
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users on leaderboard" ON public.leaderboard;
CREATE POLICY "Enable read access for all users on leaderboard" ON public.leaderboard
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert/update for authenticated users on leaderboard" ON public.leaderboard;
CREATE POLICY "Enable insert/update for authenticated users on leaderboard" ON public.leaderboard
  FOR ALL USING (auth.role() = 'authenticated');
