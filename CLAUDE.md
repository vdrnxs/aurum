# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aurum is an AI-powered cryptocurrency trading signal generator that analyzes OHLCV data from Hyperliquid using technical indicators and Claude AI to generate automated trading signals every 4 hours.

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRON JOB (Every 4 hours)                     │
│              00:00, 04:00, 08:00, 12:00, 16:00, 20:00           │
│                  (GitHub Actions / cron-job.org)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             BACKEND: POST /api/analyze-signals                  │
│                 (Vercel Serverless Function)                    │
│                                                                 │
│  1. Fetch 100 candles from Hyperliquid API                      │
│  2. Save/update candles in Supabase (upsert)                    │
│  3. Calculate technical indicators (SMA, EMA, RSI, MACD, etc.)  │
│  4. Convert data to TOON format (compressed JSON)               │
│  5. Send to Claude AI for analysis                              │
│  6. Parse AI response → trading signal (BUY/SELL/HOLD)          │
│  7. Save signal to 'trading_signals' table                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SUPABASE (PostgreSQL)                          │
│                                                                 │
│  Table: candles                                                 │
│  - Stores last 100 candles per symbol/interval                 │
│  - Updated every 4h via upsert                                  │
│                                                                 │
│  Table: trading_signals                                         │
│  - id, symbol, interval, timestamp                              │
│  - signal (BUY/SELL/HOLD/STRONG_BUY/STRONG_SELL)                │
│  - confidence (0-100%), indicators_data (JSONB)                 │
│  - ai_reasoning, ai_model, processing_time_ms                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND (React + TanStack Query)                  │
│                                                                 │
│  - Fetch trading signals from Supabase                          │
│  - TanStack Query handles local caching                         │
│  - Display signals + charts + AI reasoning                      │
│  - Auto-refresh when new signals arrive (Realtime optional)     │
│  - No Hyperliquid API fallback needed                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Details

**Type**: Cron-based AI Analysis Pipeline (NOT on-demand)
- Backend runs **every 4 hours** via scheduled cron job
- Fully automated - no user interaction needed to generate signals
- Frontend is read-only - displays pre-calculated signals

**Data Flow**:
1. Cron job triggers `POST /api/analyze-signals` every 4 hours
2. Backend fetches fresh candles from Hyperliquid
3. Candles saved to Supabase with upsert (no duplicates)
4. Technical indicators calculated server-side
5. Data converted to TOON format for efficient AI processing
6. Claude AI analyzes data and generates trading signal
7. Signal saved to `trading_signals` table
8. Frontend reads signals via TanStack Query (cached locally)
9. Optional: Realtime updates when new signals arrive

**Trading Signal Strategy**:
- Signals generated every 4 hours at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
- Each signal includes: direction (BUY/SELL/HOLD), confidence (0-100%), AI reasoning
- Historical signals preserved for backtesting and analysis
- Old signals (>30 days) automatically deleted

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **UI Components**: Tremor React
- **Charts**: Tremor React (built on Recharts)
- **Backend**: Vercel Serverless Functions (REST API)
- **AI Analysis**: Claude API (Anthropic)
- **Data Format**: TOON (compressed JSON for LLMs)
- **Data Source**: Hyperliquid REST API
- **Database**: Supabase (PostgreSQL)
- **Technical Indicators**: indicatorts library
- **Cron Jobs**: GitHub Actions (free) or cron-job.org
- **Deployment**: Vercel (auto-deploy from GitHub)

## Project Structure

```
aurum/
├── api/
│   ├── candles.ts              # Legacy endpoint (deprecated)
│   └── analyze-signals.ts      # Main AI analysis pipeline
│
├── src/
│   ├── components/
│   │   ├── CandlestickChart.tsx
│   │   └── TradingSignalCard.tsx # Signal display component
│   │
│   ├── hooks/
│   │   ├── useCandles.ts       # (deprecated - will be removed)
│   │   ├── useIndicators.ts    # (deprecated - indicators now server-side)
│   │   └── useTradingSignals.ts # Fetch signals with TanStack Query
│   │
│   ├── services/
│   │   ├── candles.ts          # Supabase queries for candles
│   │   ├── signals.ts          # Supabase queries for signals
│   │   ├── dataService.ts      # (deprecated)
│   │   ├── hyperliquid.ts      # (used by backend only)
│   │   └── indicators.ts       # Technical indicators (shared with backend)
│   │
│   ├── types/
│   │   └── database.ts         # TypeScript type definitions
│   │
│   ├── lib/
│   │   └── supabase.ts         # Supabase client (anon key)
│   │
│   └── utils/
│       ├── query-builder.ts    # Supabase query helpers
│       └── supabase-error.ts   # Error handling
│
├── supabase/
│   ├── schema.sql              # Candles table schema
│   └── schema-signals.sql      # Trading signals table schema
│
├── .github/
│   └── workflows/
│       └── trading-signals.yml # Cron job (GitHub Actions)
│
└── package.json
```

## Development

### Local Development Commands

```bash
# Frontend only (Vite dev server)
npm run dev              # http://localhost:5173
                         # Reads signals from Supabase

# Full stack (Frontend + API)
vercel dev               # http://localhost:3000
                         # Test API endpoints locally

# Trigger signal analysis manually (for testing)
curl -X POST http://localhost:3000/api/analyze-signals \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["BTC"], "interval": "4h", "limit": 100}'

# Build & other
npm run build            # Build for production
npm run lint             # Run ESLint
npm run preview          # Preview production build
```

### Environment Variables

#### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Backend (for vercel dev - .env)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

#### Production (Vercel Dashboard)
Set these in Vercel project settings → Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `VITE_SUPABASE_URL` (auto-injected to frontend build)
- `VITE_SUPABASE_ANON_KEY` (auto-injected to frontend build)

**Note**:
- Variables with `VITE_` prefix are exposed to the frontend bundle
- Backend variables (without prefix) are only accessible in serverless functions
- Never expose `ANTHROPIC_API_KEY` to frontend

## Supabase Setup

### 1. Create Candles Table
Run `supabase/schema.sql` in Supabase SQL Editor to create the `candles` table with proper indexes and constraints.

### 2. Create Trading Signals Table
Run `supabase/schema-signals.sql` to create the `trading_signals` table:

```sql
CREATE TABLE IF NOT EXISTS trading_signals (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  candles_timestamp BIGINT NOT NULL,
  signal TEXT NOT NULL CHECK (signal IN ('BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL')),
  confidence DECIMAL(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  indicators_data JSONB NOT NULL,
  ai_reasoning TEXT,
  ai_model TEXT DEFAULT 'claude-sonnet-4',
  processing_time_ms INTEGER,
  CONSTRAINT unique_signal_per_interval UNIQUE (symbol, interval, candles_timestamp)
);

CREATE INDEX idx_signals_symbol_interval ON trading_signals(symbol, interval);
CREATE INDEX idx_signals_created_at ON trading_signals(created_at DESC);
CREATE INDEX idx_signals_signal ON trading_signals(signal);
```

### 3. Configure RLS (Row Level Security)
Run RLS policies for both tables:

**Candles table**:
- `candles_select`: Public read access (anyone with anon key)
- No INSERT/UPDATE/DELETE policies for anon key (blocked by default)
- Backend uses `service_role` key which bypasses RLS automatically

**Trading signals table**:
- `trading_signals_select`: Public read access (anyone with anon key)
- No INSERT/UPDATE/DELETE policies for anon key (blocked by default)
- Backend uses `service_role` key which bypasses RLS automatically

```sql
-- Enable RLS
ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "trading_signals_select" ON trading_signals
  FOR SELECT USING (true);
```

**Why this is secure**:
- Frontend (anon key) can only SELECT data
- Only backend (service_role) can INSERT/UPDATE/DELETE
- service_role key is never exposed to the client
- Even if anon key leaks, attackers can only read public data

### 4. Set Up Cleanup Cron (Optional)

To delete old signals (>30 days):

```sql
-- Enable pg_cron extension
-- (In Supabase Dashboard → Database → Extensions)

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM trading_signals
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule daily cleanup at 01:00
SELECT cron.schedule(
  'cleanup-old-signals',
  '0 1 * * *',
  'SELECT cleanup_old_signals()'
);
```

## API Endpoints

### POST /api/analyze-signals

**Purpose**: Main pipeline - fetches candles, calculates indicators, gets AI analysis, saves signal

**Request**:
```json
{
  "symbols": ["BTC", "ETH", "SOL"],
  "interval": "4h",
  "limit": 100
}
```

**Valid symbols**: BTC, ETH, SOL, AVAX, ARB, MATIC, DOGE, LINK
**Valid intervals**: 1m, 5m, 15m, 1h, 4h, 1d
**Limit range**: 1-500 (recommended: 100)

**Response (Success)**:
```json
{
  "success": true,
  "signals": [
    {
      "symbol": "BTC",
      "interval": "4h",
      "candles_timestamp": 1234567890,
      "signal": "BUY",
      "confidence": 75.5,
      "indicators_data": { "rsi": [45.2], "sma_20": [...] },
      "ai_reasoning": "Strong uptrend with RSI not overbought",
      "ai_model": "claude-sonnet-4-20250514",
      "processing_time_ms": 3450
    }
  ],
  "processing_time_ms": 5200
}
```

**Response (Error)**:
```json
{
  "error": "Missing Anthropic API key"
}
```

### POST /api/candles (Deprecated)

This endpoint is **deprecated** and will be removed. Use `/api/analyze-signals` instead.

## Cron Job Setup

### Option 1: GitHub Actions (Free, Recommended)

Create `.github/workflows/trading-signals.yml`:

```yaml
name: Generate Trading Signals

on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
  workflow_dispatch:  # Allow manual trigger

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger analysis
        run: |
          curl -X POST https://your-app.vercel.app/api/analyze-signals \
            -H "Content-Type: application/json" \
            -d '{"symbols": ["BTC", "ETH", "SOL"], "interval": "4h", "limit": 100}'
```

**Advantages**:
- Completely free
- Runs on GitHub's infrastructure
- Easy to monitor (Actions tab)
- Can trigger manually for testing

### Option 2: External Cron (cron-job.org - Free)

1. Create account at [cron-job.org](https://cron-job.org)
2. Add new cron job:
   - URL: `https://your-app.vercel.app/api/analyze-signals`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body: `{"symbols": ["BTC", "ETH", "SOL"], "interval": "4h", "limit": 100}`
   - Schedule: `0 */4 * * *` (every 4 hours)

### Option 3: Vercel Cron (Requires PRO plan - $20/month)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/analyze-signals",
    "schedule": "0 */4 * * *"
  }]
}
```

## Deployment

### Automatic Deployment (Vercel)
1. Push to GitHub main branch
2. Vercel auto-detects changes
3. Builds frontend (Vite)
4. Deploys serverless functions from `/api`
5. Available at `https://your-project.vercel.app`

### Manual Deployment
```bash
vercel --prod
```

### Post-Deployment Checklist
1. Verify environment variables are set in Vercel Dashboard
2. Test `/api/analyze-signals` endpoint manually
3. Set up cron job (GitHub Actions or cron-job.org)
4. Monitor first few automated runs
5. Check Supabase `trading_signals` table for new entries

## Code Style Guidelines

- Follow SOLID and DRY principles
- **No emojis in code** (comments, variable names, function names)
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Keep AI prompts concise but clear
- Always validate AI responses before saving

## Glossary

| Term | Definition | Example in this project |
|------|------------|-------------------------|
| **API** | Application Programming Interface - way for programs to communicate | `/api/analyze-signals` endpoint |
| **Endpoint** | Specific URL path in an API | `POST /api/analyze-signals` |
| **Serverless** | Code that runs on-demand without managing servers | Vercel Functions |
| **Cron** | Scheduled task that runs automatically | Every 4 hours signal generation |
| **RLS** | Row Level Security - database-level access control | Supabase policies |
| **Service Role** | Admin-level database key that bypasses RLS | Backend API uses this |
| **Anon Key** | Public database key with limited permissions | Frontend uses this |
| **TOON** | Compressed JSON format optimized for LLMs | Used for AI prompt efficiency |
| **TanStack Query** | React data fetching/caching library | Replaces manual cache management |
| **Trading Signal** | AI-generated recommendation (BUY/SELL/HOLD) | Generated every 4h |

## Data Types

### Candle Intervals
Recommended for AI analysis: `4h`, `1d`
Also supported: `1m`, `5m`, `15m`, `1h`

### Supported Symbols
`BTC`, `ETH`, `SOL`, `AVAX`, `ARB`, `MATIC`, `DOGE`, `LINK`

### Trading Signals
- `STRONG_BUY`: High confidence buy signal (RSI oversold, strong uptrend)
- `BUY`: Moderate buy signal
- `HOLD`: No clear direction or conflicting indicators
- `SELL`: Moderate sell signal
- `STRONG_SELL`: High confidence sell signal (RSI overbought, strong downtrend)

### Technical Indicators
- **SMA** (Simple Moving Average) - 20, 50 periods
- **EMA** (Exponential Moving Average) - 12, 26 periods
- **RSI** (Relative Strength Index) - 14 periods (overbought >70, oversold <30)
- **MACD** (Moving Average Convergence Divergence) - Signal line crossovers
- **BB** (Bollinger Bands) - 20 periods, 2 std dev
- **ATR** (Average True Range) - Volatility indicator
- **Stochastic** (Stochastic Oscillator)
- **Parabolic SAR** (Stop and Reverse)

See `src/types/database.ts` for complete type definitions.

## Costs Estimation

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| **Supabase** | Free | $0 (up to 500MB DB) |
| **Vercel** | Hobby | $0 (serverless functions included) |
| **GitHub Actions** | Free | $0 (2000 min/month) |
| **Anthropic API** | Pay-as-you-go | ~$1-2 (540 requests/month) |
| **Total** | | **~$1-2/month** |

**Breakdown**:
- 6 cron runs/day × 30 days = 180 runs/month
- 3 symbols per run = 540 AI requests/month
- Claude Sonnet 4: ~$0.003 per request (depends on token usage)

## Troubleshooting

### Cron job not running
- Check GitHub Actions tab for errors
- Verify cron-job.org is active and not paused
- Check Vercel function logs for errors
- Ensure endpoint is publicly accessible

### AI analysis failing
- Verify `ANTHROPIC_API_KEY` is set in Vercel environment variables
- Check API key has sufficient credits
- Review Vercel function logs for error messages
- Ensure TOON data format is valid
- Check if prompt is within token limits

### No signals appearing in frontend
- Verify cron has run at least once (check `trading_signals` table)
- Check TanStack Query devtools for errors
- Verify Supabase RLS policies allow SELECT
- Check browser console for errors
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### Signals have low quality / incorrect
- Review AI reasoning in `ai_reasoning` column
- Adjust prompt in `/api/analyze-signals` to be more specific
- Increase number of candles analyzed (limit parameter)
- Add more technical indicators to analysis
- Fine-tune indicator parameters (e.g., RSI period)

### High API costs
- Reduce cron frequency (e.g., every 8h instead of 4h)
- Reduce number of symbols analyzed per run
- Optimize TOON format to use fewer tokens
- Use Claude Haiku (cheaper) instead of Sonnet for testing
- Add caching layer to avoid duplicate analyses

### TanStack Query not updating
- Check `refetchInterval` is set correctly (4 hours)
- Verify `staleTime` matches cron frequency
- Use `invalidateQueries` when needed
- Check Realtime subscription is active (if enabled)