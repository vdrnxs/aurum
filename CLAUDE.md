# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aurum is a financial dashboard application that visualizes OHLCV (Open, High, Low, Close, Volume) cryptocurrency data from Hyperliquid.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  1. Check Supabase for cached data                          │
│  2. If stale/empty -> call /api/candles                     │
│  3. Read updated data from Supabase                         │
│  4. Calculate indicators client-side                        │
└─────────────────────────────────────────────────────────────┘
                              │
                    POST /api/candles
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               BACKEND (Vercel Serverless)                   │
│  api/candles.ts                                             │
│  - Validates request (symbol, interval)                     │
│  - Fetches from Hyperliquid REST API                        │
│  - Saves to Supabase with service_role key                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE (PostgreSQL)                   │
│  - Table: candles                                           │
│  - RLS: SELECT public, INSERT/UPDATE/DELETE service_role    │
│  - Cron: Clears data daily at 00:00                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
1. User opens app
2. Frontend checks Supabase for cached candles
3. If no data or stale -> Frontend calls `POST /api/candles`
4. Backend fetches from Hyperliquid, saves to Supabase
5. Frontend reads fresh data from Supabase
6. Indicators calculated client-side

### Key Files
- `api/candles.ts`: Vercel serverless function (backend)
- `src/services/dataService.ts`: Orchestrates data fetching
- `src/services/candles.ts`: Supabase read-only queries
- `src/services/hyperliquid.ts`: Direct Hyperliquid API (fallback)
- `src/services/indicators.ts`: Technical indicators (SMA, EMA, RSI, MACD, BB, ATR)

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run linter
```

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (Vercel Environment Variables)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Supabase Setup

1. Run `supabase/schema.sql` to create the candles table
2. Run `supabase/rls-policies.sql` to configure RLS (SELECT only for anon)
3. Set up a cron job to clear data daily at 00:00

## Code Style Guidelines

- Follow SOLID and DRY principles
- **No emojis in code**
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use descriptive variable and function names

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **UI Components**: Tremor React
- **Backend**: Vercel Serverless Functions
- **Data Source**: Hyperliquid REST API
- **Database**: Supabase (PostgreSQL)

## Hyperliquid Data Types

- Intervals: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 8h, 12h, 1d, 3d, 1w, 1M
- See `src/types/database.ts` for type definitions