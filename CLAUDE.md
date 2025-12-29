# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aurum is an AI-powered cryptocurrency trading platform that:
1. **Analyzes signals** - GPT-4o-mini analyzes OHLCV data + technical indicators every 4 hours
2. **Executes trades** - Automated trading on Hyperliquid DEX (testnet) with risk management
3. **Displays dashboard** - Real-time signal history, positions, and AI reasoning

## Technology Stack

- **Framework**: Next.js 15 (App Router + React 19)
- **Styling**: Tailwind CSS v4
- **UI**: shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **Trading**: Hyperliquid SDK (testnet)
- **Data Format**: TOON (compressed JSON for LLMs)
- **Package Manager**: pnpm

## Development Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build
pnpm start            # Run production server

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm type-check       # TypeScript validation (no emit)

# Trading Scripts
npx tsx scripts/test-limit-order.ts    # Test LIMIT order with SL/TP on testnet
```

## Architecture Overview

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRON JOB (Every 4 hours)                     │
│              00:00, 04:00, 08:00, 12:00, 16:00, 20:00           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             BACKEND: POST /api/analyze-signals                  │
│                 (Next.js API Route)                             │
│                                                                 │
│  1. Fetch 100 candles from Hyperliquid API                      │
│  2. Save/update candles in Supabase (upsert)                    │
│  3. Calculate technical indicators (SMA, EMA, RSI, MACD)        │
│  4. Convert data to TOON format (compressed JSON)               │
│  5. Send to GPT-4o-mini for analysis                            │
│  6. Parse AI response → trading signal (BUY/SELL/HOLD)          │
│  7. Save signal to 'trading_signals' table                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SUPABASE (PostgreSQL)                          │
│                                                                 │
│  Table: trading_signals                                         │
│  - signal (BUY/SELL/HOLD/STRONG_BUY/STRONG_SELL)                │
│  - confidence (0-100%), indicators_data (JSONB)                 │
│  - ai_reasoning, entry_price, stop_loss, take_profit           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js 15 + React 19)                   │
│                                                                 │
│  - Dashboard: Latest signals, stats, AI reasoning               │
│  - Signal History: Last 20 signals with full details            │
│  - Fetch via server components (no client-side Supabase)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Trading Execution Flow

```
User/AI Signal
    ↓
POST /api/trade
    ↓
lib/api/trading.ts → placeLimitOrderWithSLTP()
    ↓
Hyperliquid SDK
    ↓ 1. Set leverage (1x = no leverage)
    ↓ 2. Place LIMIT entry order
    ↓ 3. Place Stop Loss trigger (reduce_only)
    ↓ 4. Place Take Profit trigger (reduce_only)
    ↓
Hyperliquid DEX (Testnet)
    ✅ Order in DEX order book
    ✅ SL/TP waiting for trigger
```

## Project Structure

```
aurum/
├── app/
│   ├── (dashboard)/              # Route group - shares sidebar layout
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   └── page.tsx              # Home page: / (signals dashboard)
│   │
│   └── api/                      # API routes (Next.js 15 App Router)
│       ├── analyze-signals/      # AI signal generation pipeline
│       ├── trade/                # Trading execution (OPEN/CLOSE positions)
│       ├── orders/               # Order management (view/cancel)
│       └── test-pipeline/        # Development testing
│
├── lib/
│   ├── api/                      # Backend business logic
│   │   ├── trading.ts            # ⭐ Hyperliquid trading service
│   │   ├── hyperliquid.ts        # Market data fetching
│   │   ├── indicators.ts         # Technical indicators calculation
│   │   ├── openai.ts             # GPT-4o-mini integration
│   │   ├── toon.ts               # TOON format converter
│   │   └── logger.ts             # Structured logging
│   │
│   ├── services/                 # Frontend data layer
│   │   └── signals-service.ts    # Signal CRUD operations
│   │
│   └── supabase/                 # Database clients
│       ├── client.ts             # Browser client (anon key)
│       └── server.ts             # Server client (service role)
│
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── dashboard/                # Dashboard components
│   │   ├── sidebar.tsx
│   │   └── stats-grid.tsx
│   │
│   └── signals/                  # Trading signals domain
│       ├── signal-card.tsx       # Latest signal hero card
│       └── signals-table.tsx     # Historical signals table
│
├── scripts/
│   └── test-limit-order.ts       # ⭐ Test trading script
│
└── types/
    └── database.ts               # TypeScript types (single source of truth)
```

## Key Architecture Concepts

### Next.js 15 App Router

**Route Groups** - Folders in parentheses `(dashboard)`:
- **DO NOT** affect URL paths
- **DO** allow shared layouts without URL nesting
- Example: `app/(dashboard)/page.tsx` → URL: `/` (not `/dashboard`)
- All pages under `(dashboard)/` share the sidebar layout

**API Routes** - Serverless functions:
- Create `app/api/[name]/route.ts`
- Export `GET`, `POST`, `DELETE`, etc. as async functions
- Use `NextRequest` and `NextResponse` from `next/server`

### Data Flow Separation

**Frontend (Browser)**:
- Uses `lib/supabase/client.ts` (anon key)
- Server Components fetch data server-side
- Client Components for interactivity only

**Backend (API Routes)**:
- Uses `lib/supabase/server.ts` (service role key)
- Full database access (bypasses RLS)
- Never expose service role key to client

### Trading Service Architecture

**lib/api/trading.ts** - Core trading functions:
- `placeLimitOrderWithSLTP()` - LIMIT order + auto SL/TP
- `placeOrder()` - Simple MARKET or LIMIT order
- `closePosition()` - Close existing position
- `getAccountBalance()` - Get Hyperliquid wallet balance
- `getPositions()` - List open positions
- `getOpenOrders()` - List pending orders
- `cancelOrder()` - Cancel specific order
- `cancelAllOrders()` - Cancel all orders for symbol

**Hyperliquid SDK Usage**:
```typescript
const sdk = new Hyperliquid({
  privateKey: process.env.HYPERLIQUID_API_WALLET_PRIVATE_KEY,
  testnet: true,  // Always use testnet
  enableWs: false // REST API only
});
```

**Order Types**:
- **LIMIT**: Order sits in order book until price is hit
- **MARKET**: Executes immediately at current price (uses LIMIT with slippage)
- **Trigger (SL/TP)**: Activates when price touches trigger level

## Environment Variables

### Frontend (NEXT_PUBLIC_ prefix - exposed to browser)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (No prefix - server-side only)
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# Hyperliquid Trading (CRITICAL - never expose to frontend)
HYPERLIQUID_API_WALLET_PRIVATE_KEY=0x...
HYPERLIQUID_WALLET_ADDRESS=0x...
HYPERLIQUID_TESTNET=true
```

**Security Note**:
- Variables with `NEXT_PUBLIC_` are bundled into frontend JavaScript
- Backend variables are ONLY accessible in API routes
- Never use `NEXT_PUBLIC_` with sensitive keys (OpenAI, Hyperliquid)

## API Endpoints

### POST /api/trade
Execute trades on Hyperliquid testnet.

**Open Position (LIMIT with SL/TP)**:
```json
{
  "action": "OPEN",
  "symbol": "BTC",
  "signal": "BUY",
  "orderType": "LIMIT",
  "entryPrice": 88000,
  "stopLoss": 87000,
  "takeProfit": 90000,
  "size": 0.001
}
```

**Close Position**:
```json
{
  "action": "CLOSE",
  "symbol": "BTC"
}
```

### GET /api/trade
Get account info: balance, positions, open orders.

### GET /api/orders?symbol=BTC
List open orders (optionally filtered by symbol).

### DELETE /api/orders?symbol=BTC&orderId=12345
Cancel specific order or all orders for a symbol.

### POST /api/analyze-signals
AI signal generation pipeline (triggered by cron).

```json
{
  "symbols": ["BTC", "ETH", "SOL"],
  "interval": "4h",
  "limit": 100
}
```

## Common Development Tasks

### Adding a New Page
1. Create `app/(dashboard)/new-page/page.tsx`
2. URL becomes `/new-page` (not `/dashboard/new-page`)
3. Sidebar layout automatically applied

### Adding a New API Endpoint
1. Create `app/api/my-endpoint/route.ts`
2. Export async functions: `GET`, `POST`, etc.
3. Use backend utilities from `lib/api/`

### Testing Trading Functionality
```bash
# Test LIMIT order with SL/TP
npx tsx scripts/test-limit-order.ts

# Should output:
# ✅ Entry: [{"resting":{"oid":45733287256}}]
# ✅ SL: ["waitingForTrigger"]
# ✅ TP: ["waitingForTrigger"]
```

### Manually Trigger Signal Analysis
```bash
curl -X POST http://localhost:3000/api/analyze-signals \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["BTC"], "interval": "4h", "limit": 100}'
```

## Technical Indicators

**Calculated in** `lib/api/indicators.ts`:
- **SMA** (Simple Moving Average) - 20, 50 periods
- **EMA** (Exponential Moving Average) - 12, 26 periods
- **RSI** (Relative Strength Index) - 14 periods (>70 overbought, <30 oversold)
- **MACD** (Moving Average Convergence Divergence) - Signal crossovers
- **Bollinger Bands** - 20 periods, 2 std dev
- **ATR** (Average True Range) - Volatility
- **Stochastic** - Momentum indicator
- **Parabolic SAR** - Trend following

## Trading Signal Types

- `STRONG_BUY` - High confidence buy (>80%), RSI oversold, strong uptrend
- `BUY` - Moderate buy signal (60-79%)
- `HOLD` - No clear direction, conflicting indicators
- `SELL` - Moderate sell signal (60-79%)
- `STRONG_SELL` - High confidence sell (>80%), RSI overbought, strong downtrend

## Code Style Guidelines

- Follow SOLID and DRY principles
- Use TypeScript strict mode
- Prefer functional components with React hooks
- No emojis in code (comments, variable names, function names)
- Use descriptive names (`calculateRiskReward` not `calc`)
- Add JSDoc for complex functions
- Validate AI responses before saving
- Always use `@/` import aliases

## Supabase RLS (Row Level Security)

**Frontend Access (anon key)**:
- ✅ SELECT (read) only
- ❌ INSERT/UPDATE/DELETE blocked

**Backend Access (service role key)**:
- ✅ Full access (bypasses RLS automatically)
- Used in API routes only
- Never exposed to browser

**Why this is secure**:
- Even if anon key leaks, attackers can only read data
- Write operations require service role key (backend only)

## Deployment (Vercel)

1. Push to GitHub main branch
2. Vercel auto-deploys
3. Set environment variables in Vercel dashboard
4. Set up cron job (GitHub Actions or cron-job.org)

**Cron Setup (GitHub Actions)**:
```yaml
# .github/workflows/trading-signals.yml
on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://your-app.vercel.app/api/analyze-signals \
            -H "Content-Type: application/json" \
            -d '{"symbols": ["BTC"], "interval": "4h", "limit": 100}'
```

## Troubleshooting

### Trading Orders Failing

**"Order has invalid size"**
- BTC minimum size: 0.001 BTC (~$88 at current price)
- Not dollar-based - must use BTC units

**"Price must be divisible by tick size"**
- BTC prices must be whole numbers (88000, 87000, not 88123.45)
- Use `Math.round(price)` for BTC

**Balance shows $0 but has funds**
- Testnet balance display may be delayed
- Check actual positions with `getPositions()`

### AI Analysis Failing
- Verify `OPENAI_API_KEY` in environment variables
- Check API key has credits
- Review Vercel function logs
- Ensure TOON format is valid

### No Signals in Frontend
- Check cron has run (view `trading_signals` table in Supabase)
- Verify RLS policy allows SELECT
- Check browser console for errors
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

## Costs Estimation

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Supabase | Free | $0 (up to 500MB) |
| Vercel | Hobby | $0 |
| GitHub Actions | Free | $0 (2000 min/month) |
| OpenAI API | Pay-as-you-go | ~$0.10-$0.50 |
| **Total** | | **~$0.10-$0.50/month** |

## Important Notes

- **Trading is on TESTNET only** - Never deploy to mainnet without explicit user request
- All trading operations use `HYPERLIQUID_TESTNET=true`
- Hyperliquid SDK v1.7.7 (check compatibility before upgrading)
- Next.js 15 App Router (not Pages Router)
- React 19 (not React 18)
- Tailwind CSS v4 (not v3)
