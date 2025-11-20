-- TEMPORAL: Permitir que el frontend inserte datos para testing
-- Ejecuta esto en Supabase SQL Editor

-- Eliminar política restrictiva
DROP POLICY IF EXISTS "Allow service role insert" ON candles;

-- Crear política que permita INSERT público
CREATE POLICY "Allow public insert for testing"
  ON candles
  FOR INSERT
  TO public  -- Permite anon key
  WITH CHECK (true);

-- NOTA: En producción deberías tener un backend que use service_role
-- Esta política es SOLO para desarrollo/testing
