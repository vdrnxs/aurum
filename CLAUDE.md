# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aurum is a financial dashboard application that visualizes OHLCV (Open, High, Low, Close, Volume) cryptocurrency data from Hyperliquid. The architecture follows a three-tier design:

1. **Data Source**: Hyperliquid WebSocket API (wss://api.hyperliquid.xyz/ws)
2. **Database**: Supabase PostgreSQL with REST API
3. **Frontend**: React + TypeScript + Vite with Tremor components

## Architecture

### Data Flow
```
Hyperliquid WebSocket → Backend Script → Supabase (PostgreSQL) → React Frontend
```

### Backend (Separate Script)
- The backend is a standalone Node.js/Deno script (not part of this repo yet)
- Connects to Hyperliquid WebSocket for real-time OHLCV data
- Uses Supabase `service_role` key to INSERT data into the database
- Should run 24/7 to continuously populate the database

### Frontend (This Repository)
- Uses Supabase `anon` (public) key for READ-ONLY access
- Cannot insert, update, or delete data (enforced by RLS policies)
- Displays real-time financial data using Tremor React components

### Database Schema
The `candles` table stores OHLCV data with the following structure:
- `symbol` (TEXT): Asset symbol (BTC, ETH, etc)
- `interval` (TEXT): Time interval (1m, 5m, 1h, 1d, etc)
- `open_time` (BIGINT): Opening timestamp in milliseconds
- `close_time` (BIGINT): Closing timestamp in milliseconds
- `open`, `high`, `low`, `close`, `volume` (DECIMAL): Price and volume data
- `trades_count` (INTEGER): Number of trades in the candle
- Unique constraint: `(symbol, interval, open_time)` to prevent duplicates

### Cache Strategy (48h Temporal Cache)
Supabase acts as a **temporary cache**, not permanent storage:
- **Retention**: Candles older than 48 hours are automatically deleted
- **Cleanup**: Automatic daily cleanup via `cleanup_old_candles()` function (pg_cron)
- **Fresh threshold**: Data is considered fresh for 2 hours
- **Purpose**: Reduce API calls to Hyperliquid, provide fallback if API is down
- **DB size**: Always minimal (~2-5 MB), never grows unbounded

### Row Level Security (RLS)
- Public read access (anyone with anon key can SELECT)
- Write access restricted to `service_role` only (backend script)
- Frontend cannot modify database (security best practice)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Key Files and Directories

- `src/lib/supabase.ts`: Supabase client configuration (uses anon key from .env)
- `src/types/database.ts`: TypeScript types for database schema and Hyperliquid data
- `src/services/candles.ts`: Service functions for fetching candle data from Supabase
- `supabase/schema.sql`: Complete database schema (can be executed in Supabase SQL Editor)
- `.env`: Contains Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

## Environment Setup

Required environment variables in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Important**: Never commit `.env` to version control. The anon key is for client-side use only.

## Code Style Guidelines

### SOLID and DRY Principles
- Follow SOLID principles for all new code
- Avoid code duplication (DRY - Don't Repeat Yourself)
- Extract reusable logic into utility functions or custom hooks
- Keep components focused on a single responsibility

### Code Standards
- **No emojis in code**: Never use emojis in code, comments, variable names, or function names
- Use TypeScript strict mode
- Prefer functional components with hooks over class components
- Use descriptive variable and function names

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **UI Components**: Tremor React (for charts and dashboard components)
- **Database**: Supabase (PostgreSQL with auto-generated REST API)
- **Data Source**: Hyperliquid WebSocket API

## Supabase Integration

### Available Service Functions
Located in `src/services/candles.ts`:
- `getLatestCandles(symbol, interval, limit)`: Fetch most recent candles
- `getCandlesInRange(symbol, interval, startTime, endTime)`: Fetch candles in time range
- `subscribeToCandles(symbol, interval, callback)`: Real-time subscription to new candles
- `getLatestCandle(symbol, interval)`: Fetch single most recent candle

### Hyperliquid Data Types
- Intervals: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 8h, 12h, 1d, 3d, 1w, 1M
- Data comes as JSON over WebSocket with fields: t, T, s, i, o, h, l, c, v, n
- See `HyperliquidCandle` type in `src/types/database.ts` for mapping

## Testing Connection

Use the `TestConnection` component to verify Supabase connectivity. It will:
- Attempt to fetch candles from the database
- Display connection status and any errors
- Show sample data if available
