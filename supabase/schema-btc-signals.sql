-- ============================================================================
-- BTC Trading Signals Table
-- ============================================================================
-- This table stores AI-generated trading signals for BTC
-- Signals are generated every 4 hours by the cron job
-- ============================================================================

-- Drop table if exists (use with caution in production)
-- DROP TABLE IF EXISTS btc_trading_signals CASCADE;

-- Create btc_trading_signals table
CREATE TABLE IF NOT EXISTS btc_trading_signals (
  -- Primary Key
  id BIGSERIAL PRIMARY KEY,

  -- Trading pair (always 'BTC' for this table)
  symbol TEXT NOT NULL DEFAULT 'BTC' CHECK (symbol = 'BTC'),

  -- Timeframe interval (4h, 1d, etc.)
  interval TEXT NOT NULL CHECK (interval IN ('1m', '5m', '15m', '1h', '4h', '1d')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  candles_timestamp BIGINT NOT NULL, -- Unix timestamp of the last candle analyzed

  -- Trading Signal
  signal TEXT NOT NULL CHECK (signal IN ('BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL')),
  confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100), -- 0-100%

  -- Risk Management
  entry_price DECIMAL(12,2), -- Recommended entry price
  stop_loss DECIMAL(12,2), -- Stop Loss price (SL)
  take_profit DECIMAL(12,2), -- Take Profit price (TP)

  -- AI Analysis
  ai_reasoning TEXT, -- Explanation from Claude AI

  -- Unique constraint: one signal per interval per candle timestamp
  CONSTRAINT unique_btc_signal_per_interval UNIQUE (symbol, interval, candles_timestamp)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Index for querying by interval (most common query)
CREATE INDEX IF NOT EXISTS idx_btc_signals_interval
ON btc_trading_signals(interval);

-- Index for querying by creation time (for chronological ordering)
CREATE INDEX IF NOT EXISTS idx_btc_signals_created_at
ON btc_trading_signals(created_at DESC);

-- Index for querying by signal type (for filtering BUY/SELL signals)
CREATE INDEX IF NOT EXISTS idx_btc_signals_signal
ON btc_trading_signals(signal);

-- Composite index for interval + created_at (most efficient for common queries)
CREATE INDEX IF NOT EXISTS idx_btc_signals_interval_created
ON btc_trading_signals(interval, created_at DESC);

-- Index for confidence (for filtering high-confidence signals)
CREATE INDEX IF NOT EXISTS idx_btc_signals_confidence
ON btc_trading_signals(confidence DESC);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE btc_trading_signals ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (anyone with anon key can SELECT)
CREATE POLICY "btc_signals_select" ON btc_trading_signals
  FOR SELECT USING (true);

-- Note: INSERT/UPDATE/DELETE are blocked for anon key by default
-- Only service_role key (used by backend) can write to this table
-- This is secure because service_role bypasses RLS automatically

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get latest signal for a specific interval
CREATE OR REPLACE FUNCTION get_latest_btc_signal(p_interval TEXT)
RETURNS TABLE (
  id BIGINT,
  symbol TEXT,
  interval TEXT,
  created_at TIMESTAMPTZ,
  candles_timestamp BIGINT,
  signal TEXT,
  confidence DECIMAL,
  entry_price DECIMAL,
  stop_loss DECIMAL,
  take_profit DECIMAL,
  ai_reasoning TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.symbol,
    s.interval,
    s.created_at,
    s.candles_timestamp,
    s.signal,
    s.confidence,
    s.entry_price,
    s.stop_loss,
    s.take_profit,
    s.ai_reasoning
  FROM btc_trading_signals s
  WHERE s.interval = p_interval
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get signal history for a specific interval
CREATE OR REPLACE FUNCTION get_btc_signal_history(
  p_interval TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id BIGINT,
  symbol TEXT,
  interval TEXT,
  created_at TIMESTAMPTZ,
  candles_timestamp BIGINT,
  signal TEXT,
  confidence DECIMAL,
  entry_price DECIMAL,
  stop_loss DECIMAL,
  take_profit DECIMAL,
  ai_reasoning TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.symbol,
    s.interval,
    s.created_at,
    s.candles_timestamp,
    s.signal,
    s.confidence,
    s.entry_price,
    s.stop_loss,
    s.take_profit,
    s.ai_reasoning
  FROM btc_trading_signals s
  WHERE s.interval = p_interval
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old signals (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_btc_signals()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM btc_trading_signals
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Deleted % old BTC signals', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Optional: Schedule automatic cleanup with pg_cron
-- ============================================================================

-- IMPORTANT: First enable pg_cron extension
-- In Supabase Dashboard → Database → Extensions → Enable pg_cron

-- Schedule daily cleanup at 01:00 AM
-- Uncomment to enable:

-- SELECT cron.schedule(
--   'cleanup-old-btc-signals',
--   '0 1 * * *',
--   'SELECT cleanup_old_btc_signals()'
-- );

-- To verify scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove scheduled job:
-- SELECT cron.unschedule('cleanup-old-btc-signals');

-- ============================================================================
-- Example Queries
-- ============================================================================

-- Get latest signal for 4h interval
-- SELECT * FROM get_latest_btc_signal('4h');

-- Get last 10 signals for 1d interval
-- SELECT * FROM get_btc_signal_history('1d', 10);

-- Get all BUY signals with confidence > 70%
-- SELECT * FROM btc_trading_signals
-- WHERE signal IN ('BUY', 'STRONG_BUY')
--   AND confidence > 70
-- ORDER BY created_at DESC;

-- Get signals with good risk/reward ratio (TP > 2x SL)
-- SELECT
--   created_at,
--   signal,
--   confidence,
--   entry_price,
--   stop_loss,
--   take_profit,
--   ROUND((take_profit - entry_price) / (entry_price - stop_loss), 2) as risk_reward_ratio
-- FROM btc_trading_signals
-- WHERE entry_price IS NOT NULL
--   AND stop_loss IS NOT NULL
--   AND take_profit IS NOT NULL
--   AND (take_profit - entry_price) / (entry_price - stop_loss) > 2
-- ORDER BY created_at DESC;

-- Get distribution of signals
-- SELECT signal, COUNT(*) as count
-- FROM btc_trading_signals
-- GROUP BY signal
-- ORDER BY count DESC;

-- Get average confidence per signal type
-- SELECT
--   signal,
--   ROUND(AVG(confidence), 2) as avg_confidence,
--   COUNT(*) as total_signals
-- FROM btc_trading_signals
-- GROUP BY signal
-- ORDER BY avg_confidence DESC;

-- Get signals with SL and TP
-- SELECT
--   created_at,
--   signal,
--   confidence,
--   entry_price,
--   stop_loss,
--   take_profit,
--   ai_reasoning
-- FROM btc_trading_signals
-- WHERE entry_price IS NOT NULL
-- ORDER BY created_at DESC
-- LIMIT 10;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE btc_trading_signals IS
'Stores AI-generated trading signals for Bitcoin (BTC). Signals are generated every 4 hours by analyzing technical indicators with Claude AI.';

COMMENT ON COLUMN btc_trading_signals.symbol IS
'Trading symbol (always BTC for this table)';

COMMENT ON COLUMN btc_trading_signals.interval IS
'Timeframe interval (4h recommended for swing trading, 1d for long-term)';

COMMENT ON COLUMN btc_trading_signals.signal IS
'Trading recommendation: STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL';

COMMENT ON COLUMN btc_trading_signals.confidence IS
'AI confidence level from 0-100%. Higher values indicate stronger conviction.';

COMMENT ON COLUMN btc_trading_signals.entry_price IS
'Recommended entry price for the trade';

COMMENT ON COLUMN btc_trading_signals.stop_loss IS
'Stop Loss price to limit downside risk';

COMMENT ON COLUMN btc_trading_signals.take_profit IS
'Take Profit price target';

COMMENT ON COLUMN btc_trading_signals.ai_reasoning IS
'Natural language explanation from Claude AI about why this signal was generated';