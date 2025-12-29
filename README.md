# Aurum

> AI-powered cryptocurrency trading platform with automated signal analysis and execution on Hyperliquid DEX.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                 CRON (Every 4 hours)                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            POST /api/analyze-signals                        │
│                                                             │
│  1. Fetch OHLCV data (Hyperliquid API)                      │
│  2. Calculate indicators (SMA, EMA, RSI, MACD)              │
│  3. AI analysis (GPT-4o-mini)                               │
│  4. Generate signal (BUY/SELL/HOLD)                         │
│  5. Save to Supabase                                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard                                │
│  - Latest signals + AI reasoning                            │
│  - Signal history (last 20)                                 │
│  - Entry, Stop Loss, Take Profit                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼ (optional)
┌─────────────────────────────────────────────────────────────┐
│              POST /api/trade                                │
│                                                             │
│  1. Set leverage (1x = no leverage)                         │
│  2. Place LIMIT entry order                                 │
│  3. Place Stop Loss trigger                                 │
│  4. Place Take Profit trigger                               │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│             Hyperliquid DEX (Testnet)                       │
└─────────────────────────────────────────────────────────────┘
```

## Architecture

**Tech Stack:**
- Next.js 15 (App Router) + React 19
- Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL)
- OpenAI GPT-4o-mini
- Hyperliquid SDK (testnet)

**Project Structure:**
```
app/
├── (dashboard)/        → Dashboard pages
└── api/
    ├── analyze-signals/ → AI signal generation
    ├── trade/          → Trading execution
    └── orders/         → Order management

lib/
├── api/
│   ├── trading.ts      → Hyperliquid integration
│   ├── indicators.ts   → Technical indicators
│   └── openai.ts       → AI analysis
├── services/           → Frontend data layer
└── supabase/          → Database clients

components/
├── ui/                → shadcn/ui primitives
├── dashboard/         → Dashboard components
└── signals/           → Trading signals UI
```

**Data Flow:**

1. **Signal Generation** (every 4 hours):
   - Cron → `/api/analyze-signals`
   - Fetch candles → Calculate indicators → AI analysis
   - Save signal to Supabase

2. **Trading Execution** (on-demand):
   - User/Bot → `/api/trade`
   - LIMIT order + SL/TP → Hyperliquid DEX
   - Order sits in order book until price hit

**Security:**
- Testnet only (all trading on Hyperliquid testnet)
- Environment isolation (no sensitive keys in frontend)
- Supabase RLS (frontend read-only access)

## Quick Start

```bash
pnpm install                    # Install dependencies
cp .env.example .env.local      # Configure environment
pnpm dev                        # Start dev server (localhost:3000)
```

**Test Trading:**
```bash
npx tsx scripts/test-limit-order.ts
```

## API

**Generate Signal:**
```bash
POST /api/analyze-signals
{ "symbols": ["BTC"], "interval": "4h", "limit": 100 }
```

**Execute Trade:**
```bash
POST /api/trade
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

**Get Account Info:**
```bash
GET /api/trade
# Returns: balance, positions, open orders

```
##
**Built with** [Next.js](https://nextjs.org/) • [Tailwind CSS](https://tailwindcss.com/) • [shadcn/ui](https://ui.shadcn.com/)
