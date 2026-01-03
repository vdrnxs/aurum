# Aurum

> AI-powered crypto trading platform with automated signal generation and execution on Hyperliquid DEX.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

## How It Works

```mermaid
graph TD
    A[CRON Scheduled Trigger] --> B[Serverless Function: /api/analyze-signals]

    B --> C[1. Fetch OHLCV Candles]
    C --> |Hyperliquid REST API| C1[candleSnapshot request]
    C1 --> C2[Zod validation]
    C2 --> C3[Upsert to Supabase]

    C3 --> D[2. Calculate Technical Indicators]
    D --> D1[indicatorts library]
    D1 --> D2[SMA, EMA, RSI, MACD<br/>Bollinger Bands, ATR, PSAR]

    D2 --> E[3. Compress to TOON Format]
    E --> E1[Metadata + Indicators + Candles]
    E1 --> E2[Binary-like encoding]

    E2 --> F[4. AI Analysis]
    F --> F1[Cerebras z.ai-glm-4.6]
    F1 --> F2[ATR-based SL/TP calculation]
    F2 --> F3[JSON: signal + confidence + reasoning]

    F3 --> G[5. Validate & Store]
    G --> G1[Zod schema validation]
    G1 --> G2[Business logic checks]
    G2 --> G3[Insert to PostgreSQL]

    G3 --> H{6. Auto-trade?}
    H -->|Confidence met| H1[Calculate position size]
    H1 --> H2[Execute via Hyperliquid SDK]
    H -->|No| I[Skip]

    H2 --> J[(Supabase PostgreSQL)]
    I --> J
    J --> J1[trading_signals table]
    J --> J2[indicators table]
    J --> J3[candles table]

    J --> K[Frontend: Dashboard Pages]
    K --> K1[/signals/bitcoin]
    K1 --> K2[Supabase client: read-only]
    K2 --> K3[Stats + Signal Card + History]

    K --> K4[/trading]
    K4 --> K5[GET /api/trade]
    K5 --> K6[Hyperliquid SDK:<br/>getClearinghouseState<br/>getFrontendOrders]
    K6 --> K7[Position Roadmaps<br/>+ P&L Tracking]

    K7 --> L[Manual Trade Execution]
    L --> L1[POST /api/trade]
    L1 --> L2[Hyperliquid SDK Operations]
    L2 --> L3[1. Set Leverage]
    L3 --> L4[2. LIMIT Entry Order]
    L4 --> L5[3. SL Trigger reduce_only]
    L5 --> L6[4. TP Trigger reduce_only]
    L6 --> L7[Orders in DEX order book]

    style A fill:#e1f5ff
    style F1 fill:#fff4e6
    style J fill:#e8f5e9
    style L7 fill:#fce4ec
```

## Technical Architecture

**Data Collection Pipeline**
- Hyperliquid REST API → POST to `/info` endpoint
- Candle mapping: `t`=open_time, `c`=close, `h`=high, `l`=low, `v`=volume
- Zod validation → runtime type safety + data integrity
- Upsert to PostgreSQL with conflict resolution

**Indicator Calculation**
- Library: `indicatorts` (pure TypeScript TA library)
- Crypto-optimized MACD settings for faster signals
- ATR-based price targets → dynamic SL/TP calculation
- Latest values extracted for AI context

**AI Analysis Engine**
- Model: Cerebras z.ai-glm-4.6 (high-speed inference)
- Input: TOON compressed format (metadata + indicators + candles)
- Output: Structured JSON with signal, confidence, entry/SL/TP, reasoning
- Multi-layer validation: schema → business logic → risk checks

**Order Execution Strategy**
- 3-order system: Entry LIMIT + SL trigger + TP trigger
- Risk management: position sizing based on account balance & SL distance
- Reduce-only flags prevent over-leveraging
- Symbol-based order filtering for multi-position support

**Frontend Architecture**
- Server Components: initial data fetch from Supabase
- Client Components: real-time updates via polling
- Isolated data flows: signals from DB, positions from Hyperliquid SDK
- Visual roadmaps: R:R ratio visualization with proportional line lengths

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Database**: Supabase PostgreSQL with RLS
- **AI**: Cerebras z.ai-glm-4.6 + TOON format compression
- **Trading**: Hyperliquid SDK (testnet)
- **Indicators**: indicatorts library (pure TypeScript)
- **Validation**: Zod schemas for runtime type safety
- **Icons**: Lucide React + @web3icons/react

## Quick Start

```bash
pnpm install
cp .env.example .env.local      # Add your API keys
pnpm dev                        # http://localhost:3000
```

Test trading execution:
```bash
npx tsx scripts/test-limit-order.ts
```

## API Examples

**Generate AI Signal:**
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

**Get Account Data:**
```bash
GET /api/trade
→ { balance, positions, openOrders }
```

## Key Features

**Complete Signal Pipeline**
- Scheduled OHLCV data fetching from Hyperliquid
- 8 technical indicators calculated per analysis
- AI-driven signal generation with confidence scoring
- Automatic trade execution based on risk thresholds

**Advanced Order Management**
- 3-step order flow: entry + stop loss + take profit
- Dynamic position sizing based on account risk
- Vault architecture separates signing from fund storage
- Order type detection via `getFrontendOpenOrders()`

**Real-Time Position Tracking**
- Live P&L monitoring with visual roadmaps
- Risk/reward ratio visualization (proportional line lengths)
- Multi-position support with isolated order filtering
- Configurable auto-refresh intervals

**Data Security**
- Row-Level Security (RLS): frontend read-only, backend full access
- Environment variable separation (public vs server-only)
- Zod validation at every data boundary
- Testnet-only deployment for safe experimentation

---

**Built with** [Next.js](https://nextjs.org/) • [Tailwind CSS](https://tailwindcss.com/) • [shadcn/ui](https://ui.shadcn.com/) • [Hyperliquid](https://hyperliquid.xyz/)
