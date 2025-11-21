# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aurum is a financial dashboard application that visualizes OHLCV (Open, High, Low, Close, Volume) cryptocurrency data from Hyperliquid. It uses a serverless architecture with Supabase as a cache layer.

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  1. Check Supabase for cached data                          │
│  2. If stale/empty -> call POST /api/candles                │
│  3. Read updated data from Supabase                         │
│  4. If API fails -> Direct Hyperliquid fallback             │
│  5. Calculate indicators client-side                        │
└─────────────────────────────────────────────────────────────┘
                              │
                    POST /api/candles
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          BACKEND (Vercel Serverless REST API)               │
│  api/candles.ts                                             │
│  - Validates request (symbol, interval, limit)              │
│  - Fetches from Hyperliquid REST API                        │
│  - Saves to Supabase with service_role key                  │
│  - Returns success/error response                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE (PostgreSQL)                      │
│  - Table: candles                                           │
│  - RLS: SELECT public, INSERT/UPDATE/DELETE service_role    │
│  - Cron: Clears all data daily at 00:00                     │
│  - Acts as cache (not permanent storage)                    │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Details

**Type**: REST API Serverless (NOT WebSocket)
- The backend is **on-demand**: only runs when called
- No 24/7 running processes
- No real-time streaming (pull-based, not push-based)

**Data Flow**:
1. User opens app
2. Frontend checks Supabase for cached candles
3. If cache is stale (>1h) or empty → Frontend calls `POST /api/candles`
4. Backend fetches from Hyperliquid REST API, saves to Supabase
5. Frontend reads fresh data from Supabase
6. If backend fails → Direct fallback to Hyperliquid API (no cache save)
7. Technical indicators calculated client-side

**Cache Strategy**:
- Supabase acts as temporary cache (cleared daily at 00:00)
- Cache is considered fresh for 1 hour
- First user after 00:00 triggers cache refresh for everyone

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **UI Components**: Tremor React
- **Charts**: Tremor React (built on Recharts)
- **Backend**: Vercel Serverless Functions (REST API)
- **Data Source**: Hyperliquid REST API
- **Database/Cache**: Supabase (PostgreSQL)
- **Technical Indicators**: indicatorts library
- **Deployment**: Vercel (auto-deploy from GitHub)

## Project Structure

```
aurum/
├── api/
│   └── candles.ts              # Serverless API endpoint
├── src/
│   ├── components/             # React components
│   ├── hooks/
│   │   ├── useCandles.ts       # Data fetching hook
│   │   └── useIndicators.ts    # Technical indicators hook
│   ├── services/
│   │   ├── candles.ts          # Supabase read-only queries
│   │   ├── dataService.ts      # Orchestrates data fetching
│   │   ├── hyperliquid.ts      # Direct Hyperliquid API (fallback)
│   │   └── indicators.ts       # Technical indicators (SMA, EMA, RSI, MACD, BB, ATR)
│   ├── types/
│   │   └── database.ts         # TypeScript type definitions
│   ├── lib/
│   │   └── supabase.ts         # Supabase client (anon key)
│   └── utils/
│       ├── query-builder.ts    # Supabase query helpers
│       └── supabase-error.ts   # Error handling
├── supabase/
│   ├── schema.sql              # Database schema
│   └── rls-policies.sql        # Row Level Security policies
└── package.json
```

## Development

### Local Development Commands

```bash
# Frontend only (Vite dev server)
npm run dev              # http://localhost:5173
                         # API calls will fail, uses Hyperliquid fallback

# Full stack (Frontend + API)
vercel dev               # http://localhost:3000
                         # Simulates Vercel serverless environment
                         # Requires .env file with backend variables

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
```

#### Production (Vercel Dashboard)
Set these in Vercel project settings → Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL` (auto-injected to frontend build)
- `VITE_SUPABASE_ANON_KEY` (auto-injected to frontend build)

**Note**: Variables with `VITE_` prefix are exposed to the frontend bundle. Backend variables (without prefix) are only accessible in serverless functions.

## Supabase Setup

### 1. Create Table
Run `supabase/schema.sql` in Supabase SQL Editor to create the `candles` table with proper indexes and constraints.

### 2. Configure RLS (Row Level Security)
Run `supabase/rls-policies.sql` to set up secure policies:

**Current Policies**:
- `candles_select`: Public read access (anyone with anon key)
- No INSERT/UPDATE/DELETE policies for anon key (blocked by default)
- Backend uses `service_role` key which bypasses RLS automatically

**Why this is secure**:
- Frontend (anon key) can only SELECT data
- Only backend (service_role) can INSERT/UPDATE/DELETE
- service_role key is never exposed to the client
- Even if anon key leaks, attackers can only read public cache data

### 3. Set Up Daily Cleanup Cron
In Supabase Dashboard → Database → Cron Jobs:
```sql
-- Run daily at 00:00 (midnight)
SELECT cron.schedule(
  'cleanup-old-candles',
  '0 0 * * *',
  'DELETE FROM candles'
);
```

## API Endpoint

### POST /api/candles

**Purpose**: Fetch candles from Hyperliquid and cache in Supabase

**Request**:
```json
{
  "symbol": "BTC",
  "interval": "1h",
  "limit": 100
}
```

**Valid symbols**: BTC, ETH, SOL, AVAX, ARB, MATIC, DOGE, LINK
**Valid intervals**: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 8h, 12h, 1d, 3d, 1w, 1M
**Limit range**: 1-500

**Response (Success)**:
```json
{
  "success": true,
  "count": 100,
  "symbol": "BTC",
  "interval": "1h"
}
```

**Response (Error)**:
```json
{
  "error": "Invalid symbol: XYZ"
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

## Automation (Optional)

By default, the cache is filled **on-demand** (when users open the app). To pre-fill cache automatically:

### Option 1: External Cron (Free)
Use cron-job.org or similar:
1. Create account at cron-job.org
2. Add new cron job: `POST https://your-app.vercel.app/api/candles`
3. Body: `{"symbol": "BTC", "interval": "1h", "limit": 100}`
4. Schedule: Daily at 00:05 (5 minutes after DB cleanup)

### Option 2: Vercel Cron (Requires PRO plan)
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/refresh-cache",
    "schedule": "5 0 * * *"
  }]
}
```

### Option 3: Supabase Edge Function
Create a Supabase function that fetches and saves data, triggered by pg_cron.

## Code Style Guidelines

- Follow SOLID and DRY principles
- **No emojis in code** (comments, variable names, function names)
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use descriptive variable and function names
- Add JSDoc comments for complex functions

## Glossary

| Term | Definition | Example in this project |
|------|------------|-------------------------|
| **API** | Application Programming Interface - way for programs to communicate | `/api/candles` endpoint |
| **Endpoint** | Specific URL path in an API | `POST /api/candles` |
| **Serverless** | Code that runs on-demand without managing servers | Vercel Functions |
| **REST** | Architecture style using HTTP methods (GET, POST, etc.) | Our API uses POST requests |
| **WebSocket** | Real-time bidirectional connection (we DON'T use this) | N/A |
| **RLS** | Row Level Security - database-level access control | Supabase policies |
| **Service Role** | Admin-level database key that bypasses RLS | Backend API uses this |
| **Anon Key** | Public database key with limited permissions | Frontend uses this |
| **Cache** | Temporary storage for faster data access | Supabase stores last 24h |
| **Cron** | Scheduled task that runs automatically | Daily 00:00 cleanup |

## Data Types

### Candle Intervals
`1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `8h`, `12h`, `1d`, `3d`, `1w`, `1M`

### Supported Symbols
`BTC`, `ETH`, `SOL`, `AVAX`, `ARB`, `MATIC`, `DOGE`, `LINK`

### Technical Indicators
- **SMA** (Simple Moving Average)
- **EMA** (Exponential Moving Average)
- **RSI** (Relative Strength Index)
- **MACD** (Moving Average Convergence Divergence)
- **BB** (Bollinger Bands)
- **ATR** (Average True Range)

See `src/types/database.ts` for complete type definitions.

## Troubleshooting

### API not working in local development
- Use `vercel dev` instead of `npm run dev`
- Ensure `.env` file exists with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Restart `vercel dev` after changing .env

### Data not showing in production
- Check Vercel environment variables are set
- Verify Supabase RLS policies are active
- Check Vercel function logs for errors
- Confirm Supabase is not experiencing outages

### Cache always empty
- Check Supabase cron job is running
- Verify someone has opened the app after 00:00 to trigger refresh
- Consider setting up external cron (see Automation section)
