-- Migration: Add performance index for btc_trading_signals queries
-- Date: 2025-01-07
-- Purpose: Optimize frequent queries that filter by symbol, interval and order by created_at

-- Create index for common query pattern:
-- SELECT * FROM btc_trading_signals
-- WHERE symbol = 'BTC' AND interval = '4h'
-- ORDER BY created_at DESC

CREATE INDEX IF NOT EXISTS idx_signals_symbol_interval_created
ON btc_trading_signals(symbol, interval, created_at DESC);

-- This index will significantly improve performance for:
-- 1. Frontend signal history queries (lib/services/signals-service.ts)
-- 2. Latest signal fetching (dashboard)
-- 3. Signal stats calculations
--
-- Query planner will use this index instead of sequential scan
-- Expected speedup: 10-100x depending on table size
