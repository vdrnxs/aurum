-- RLS Policies para tabla candles
-- Ejecutar en Supabase SQL Editor

-- Primero, eliminar policies existentes
DROP POLICY IF EXISTS "candles_select" ON candles;
DROP POLICY IF EXISTS "candles_insert" ON candles;
DROP POLICY IF EXISTS "candles_update" ON candles;
DROP POLICY IF EXISTS "candles_delete" ON candles;
DROP POLICY IF EXISTS "Public read access" ON candles;
DROP POLICY IF EXISTS "Public insert only" ON candles;
DROP POLICY IF EXISTS "Allow public read" ON candles;
DROP POLICY IF EXISTS "Allow public write" ON candles;

-- Asegurar que RLS esta habilitado
ALTER TABLE candles ENABLE ROW LEVEL SECURITY;

-- SELECT: Cualquiera puede leer (con anon key)
CREATE POLICY "candles_select" ON candles
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Solo service_role (backend serverless)
-- No creamos policies para estas operaciones con anon key
-- El backend usa service_role que bypasea RLS automaticamente

-- Verificar policies activas
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'candles';