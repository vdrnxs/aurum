# Aurum Backend

WebSocket client that streams OHLCV candle data from Hyperliquid and stores it in Supabase.

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your Supabase credentials in `.env`:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (NOT the anon key)

3. Configure symbols and interval:
- `SYMBOLS`: Comma-separated list (e.g., `BTC,ETH,SOL`)
- `INTERVAL`: Candle interval (e.g., `1m`, `5m`, `1h`, `1d`)

## Usage

```bash
# Development mode (auto-reload on changes)
npm run dev

# Production mode
npm run start

# Build TypeScript
npm run build
```

## How it works

1. Connects to Hyperliquid WebSocket API
2. Subscribes to candle updates for configured symbols/interval
3. Transforms and inserts data into Supabase `candles` table
4. Automatic reconnection on connection loss
5. Duplicate detection (skips already inserted candles)

## Architecture

- `src/index.ts` - Main entry point and subscription logic
- `src/config.ts` - Environment configuration
- `src/supabase.ts` - Supabase client and insertion logic
- `src/transformer.ts` - Data transformation (Hyperliquid → Supabase)
- `src/types.ts` - TypeScript type definitions
