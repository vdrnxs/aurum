-- Schema para datos OHLCV de Hyperliquid
-- Este archivo puede ejecutarse directamente en Supabase SQL Editor

-- Tabla principal para almacenar candles/velas
CREATE TABLE IF NOT EXISTS candles (
  id BIGSERIAL PRIMARY KEY,

  -- Identificadores
  symbol TEXT NOT NULL,           -- Símbolo del activo (BTC, ETH, etc)
  interval TEXT NOT NULL,         -- Intervalo de tiempo (1m, 5m, 1h, etc)

  -- Timestamps (en milisegundos, como vienen de Hyperliquid)
  open_time BIGINT NOT NULL,      -- Timestamp de apertura
  close_time BIGINT NOT NULL,     -- Timestamp de cierre

  -- Datos OHLCV
  open DECIMAL(20, 8) NOT NULL,   -- Precio de apertura
  high DECIMAL(20, 8) NOT NULL,   -- Precio máximo
  low DECIMAL(20, 8) NOT NULL,    -- Precio mínimo
  close DECIMAL(20, 8) NOT NULL,  -- Precio de cierre
  volume DECIMAL(20, 8) NOT NULL, -- Volumen

  -- Metadata adicional
  trades_count INTEGER,           -- Número de trades en esta vela
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint para evitar duplicados
  CONSTRAINT unique_candle UNIQUE(symbol, interval, open_time)
);

-- Índices para optimizar queries comunes
CREATE INDEX IF NOT EXISTS idx_candles_symbol_interval
  ON candles(symbol, interval);

CREATE INDEX IF NOT EXISTS idx_candles_open_time
  ON candles(open_time DESC);

CREATE INDEX IF NOT EXISTS idx_candles_symbol_interval_time
  ON candles(symbol, interval, open_time DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE candles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS PARA ARQUITECTURA BACKEND
-- ============================================

-- LECTURA: Público (cualquiera puede leer con anon key)
-- Esto permite que tu frontend React lea los datos sin autenticación
CREATE POLICY "Allow public read access"
  ON candles
  FOR SELECT
  USING (true);

-- ESCRITURA: Solo service_role (backend script)
-- Solo el script backend con service_role key puede insertar datos
-- Tu frontend NO puede insertar (mayor seguridad)
CREATE POLICY "Allow service role insert"
  ON candles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- UPDATE: Solo service_role (por si necesitas actualizar candles históricos)
CREATE POLICY "Allow service role update"
  ON candles
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DELETE: Solo service_role (por si necesitas limpiar datos viejos)
CREATE POLICY "Allow service role delete"
  ON candles
  FOR DELETE
  TO service_role
  USING (true);

-- Comentarios para documentación
COMMENT ON TABLE candles IS 'Almacena datos OHLCV (candles) de Hyperliquid como cache temporal (24h, reset diario a las 00:00)';
COMMENT ON COLUMN candles.open_time IS 'Timestamp de apertura en milisegundos';
COMMENT ON COLUMN candles.close_time IS 'Timestamp de cierre en milisegundos';
COMMENT ON COLUMN candles.interval IS 'Intervalo: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 8h, 12h, 1d, 3d, 1w, 1M';

-- ============================================
-- CACHE TEMPORAL: LIMPIEZA AUTOMATICA DIARIA
-- ============================================
-- Esta función borra velas más antiguas de 24 horas
-- Se ejecuta a las 00:00 para hacer reset diario
-- Supabase actúa como cache temporal, solo almacena datos del día actual

CREATE OR REPLACE FUNCTION cleanup_old_candles()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  cutoff_time BIGINT;
  rows_deleted BIGINT;
BEGIN
  -- Calcular timestamp de hace 24 horas en milisegundos
  cutoff_time := EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours') * 1000;

  -- Borrar velas más antiguas de 24 horas
  DELETE FROM candles
  WHERE open_time < cutoff_time;

  -- Obtener cantidad de filas eliminadas
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;

  -- Log de la operación
  RAISE NOTICE 'Daily cleanup executed at %: deleted % candles older than 24 hours',
    NOW(),
    rows_deleted;

  RETURN QUERY SELECT rows_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario de documentación
COMMENT ON FUNCTION cleanup_old_candles() IS 'Elimina velas más antiguas de 24 horas. Se ejecuta diariamente a las 00:00';

-- ============================================
-- OPCIÓN A: Ejecutar limpieza manualmente
-- ============================================
-- Puedes llamar esta función desde tu backend o manualmente:
-- SELECT cleanup_old_candles();

-- ============================================
-- OPCIÓN B: Programar limpieza automática con pg_cron (RECOMENDADO)
-- ============================================
-- IMPORTANTE: pg_cron requiere activarse en Supabase Dashboard
-- Database > Extensions > Buscar "pg_cron" > Enable
--
-- Una vez habilitado, ejecuta este comando para programar limpieza diaria a las 00:00 (medianoche):
-- SELECT cron.schedule(
--   'cleanup-old-candles-midnight',
--   '0 0 * * *',
--   'SELECT cleanup_old_candles()'
-- );
--
-- Nota: El horario usa UTC. Si necesitas medianoche en tu zona horaria:
-- - España (CET/CEST): '0 23 * * *' (23:00 UTC = 00:00 CET en invierno)
-- - México (CST): '0 6 * * *' (06:00 UTC = 00:00 CST)
--
-- Para ver trabajos programados:
-- SELECT * FROM cron.job;
--
-- Para eliminar el trabajo programado:
-- SELECT cron.unschedule('cleanup-old-candles-midnight');
