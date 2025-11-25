-- ============================================================================
-- BTC Technical Indicators Table
-- ============================================================================
-- Stores technical indicator values for each trading signal
-- One row per signal (1-to-1 relationship with btc_trading_signals)
-- ============================================================================

CREATE TABLE IF NOT EXISTS btc_indicators (
  -- Primary Key
  id BIGSERIAL PRIMARY KEY,

  -- Foreign Key to btc_trading_signals
  signal_id BIGINT NOT NULL UNIQUE,

  -- Timestamp (same as signal)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Price
  price DECIMAL(12,2) NOT NULL,

  -- Simple Moving Averages (SMA)
  sma_21 DECIMAL(12,2),
  sma_50 DECIMAL(12,2),
  sma_100 DECIMAL(12,2),

  -- Exponential Moving Averages (EMA)
  ema_12 DECIMAL(12,2),
  ema_21 DECIMAL(12,2),
  ema_55 DECIMAL(12,2),

  -- Relative Strength Index (RSI)
  rsi_14 DECIMAL(5,2), -- 0-100
  rsi_21 DECIMAL(5,2), -- 0-100

  -- MACD
  macd_line DECIMAL(12,4),
  macd_signal DECIMAL(12,4),
  macd_histogram DECIMAL(12,4),

  -- Bollinger Bands
  bb_upper DECIMAL(12,2),
  bb_middle DECIMAL(12,2),
  bb_lower DECIMAL(12,2),

  -- Average True Range (ATR)
  atr DECIMAL(12,2),

  -- Parabolic SAR
  psar_value DECIMAL(12,2),
  psar_trend SMALLINT, -- -1 (bearish) or 1 (bullish)

  -- Stochastic Oscillator
  stoch_k DECIMAL(5,2), -- 0-100
  stoch_d DECIMAL(5,2), -- 0-100

  -- Foreign Key Constraint
  CONSTRAINT fk_signal
    FOREIGN KEY (signal_id)
    REFERENCES btc_trading_signals(id)
    ON DELETE CASCADE
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Index on signal_id (for joins)
CREATE INDEX IF NOT EXISTS idx_btc_indicators_signal_id
ON btc_indicators(signal_id);

-- Index on created_at (for time-series queries)
CREATE INDEX IF NOT EXISTS idx_btc_indicators_created_at
ON btc_indicators(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_btc_indicators_created_signal
ON btc_indicators(created_at DESC, signal_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE btc_indicators ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "btc_indicators_select" ON btc_indicators
  FOR SELECT USING (true);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE btc_indicators IS
'Technical indicator values for each BTC trading signal. Used for analysis and backtesting.';

COMMENT ON COLUMN btc_indicators.signal_id IS
'Foreign key to btc_trading_signals.id (1-to-1 relationship)';

COMMENT ON COLUMN btc_indicators.psar_trend IS
'Parabolic SAR trend: -1 (bearish/downtrend) or 1 (bullish/uptrend)';

-- ============================================================================
-- Example Queries
-- ============================================================================

-- Get indicators for latest signal
-- SELECT i.*
-- FROM btc_indicators i
-- JOIN btc_trading_signals s ON i.signal_id = s.id
-- WHERE s.interval = '4h'
-- ORDER BY i.created_at DESC
-- LIMIT 1;

-- Get signals with their indicators
-- SELECT
--   s.created_at,
--   s.signal,
--   s.confidence,
--   i.price,
--   i.rsi_14,
--   i.macd_histogram,
--   i.psar_trend
-- FROM btc_trading_signals s
-- LEFT JOIN btc_indicators i ON s.id = i.signal_id
-- WHERE s.interval = '4h'
-- ORDER BY s.created_at DESC
-- LIMIT 10;

-- Analyze average RSI by signal type
-- SELECT
--   s.signal,
--   ROUND(AVG(i.rsi_14), 2) as avg_rsi14,
--   ROUND(AVG(i.rsi_21), 2) as avg_rsi21,
--   COUNT(*) as count
-- FROM btc_trading_signals s
-- JOIN btc_indicators i ON s.id = i.signal_id
-- GROUP BY s.signal
-- ORDER BY count DESC;
