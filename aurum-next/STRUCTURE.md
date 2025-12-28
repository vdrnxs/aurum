# Aurum Next - Project Structure

## Overview
Modern Next.js 15 application with Tailwind CSS v4, shadcn/ui components, and dark mode design.

## Directory Structure

```
aurum-next/
├── app/
│   ├── (dashboard)/              # Route group - shares sidebar layout
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   └── page.tsx              # Home page: / (signals dashboard)
│   │
│   ├── api/                      # API routes (serverless functions)
│   │   ├── analyze-signals/
│   │   └── test-pipeline/
│   │
│   ├── layout.tsx                # Root layout (dark mode, fonts)
│   └── globals.css               # Tailwind CSS + theme variables
│
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   │   ├── card.tsx              # Card component
│   │   ├── badge.tsx             # Badge with variants
│   │   ├── button.tsx            # Button component
│   │   └── separator.tsx         # Separator line
│   │
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── sidebar.tsx           # Main navigation sidebar
│   │   └── stats-grid.tsx        # KPI stats cards
│   │
│   └── signals/                  # Trading signals domain
│       ├── signal-card.tsx       # Latest signal hero card
│       └── signals-table.tsx     # Historical signals table
│
├── lib/
│   ├── api/                      # Backend business logic
│   │   ├── constants.ts
│   │   ├── hyperliquid.ts
│   │   ├── indicators.ts
│   │   ├── logger.ts
│   │   ├── openai.ts
│   │   ├── price-calculator.ts
│   │   └── toon.ts
│   │
│   ├── services/                 # Data fetching layer
│   │   └── signals-service.ts    # Signals CRUD operations
│   │
│   ├── supabase/                 # Database clients
│   │   ├── client.ts             # Browser client (anon key)
│   │   └── server.ts             # Server client (service role)
│   │
│   ├── utils/                    # Pure utility functions
│   │   ├── formatters.ts         # formatPrice, formatDateTime
│   │   └── calculations.ts       # calculateRiskReward, etc.
│   │
│   ├── constants.ts              # App-wide constants
│   └── utils.ts                  # cn() helper (class merging)
│
└── types/
    └── database.ts               # TypeScript types (single source of truth)
```

## Architecture Principles

### SOLID Principles Applied

1. **Single Responsibility Principle (SRP)**
   - `lib/services/` - Data fetching only
   - `lib/utils/formatters.ts` - Formatting only
   - `lib/utils/calculations.ts` - Business calculations only
   - `components/signals/` - Signal presentation only

2. **Open/Closed Principle (OCP)**
   - Badge component uses variants (extensible via CVA)
   - Signal card accepts any `TradingSignal` type
   - Utility functions are pure and reusable

3. **Dependency Inversion Principle (DIP)**
   - Components depend on types (`TradingSignal`), not implementations
   - Services use abstract Supabase client interface

### DRY (Don't Repeat Yourself)

- ✅ Single `types/database.ts` file (no duplicates)
- ✅ Shared utility functions (`formatPrice`, `calculateRiskReward`)
- ✅ Reusable UI components (`Card`, `Badge`)
- ✅ Centralized theme in `globals.css`

### Route Groups (Next.js 13+)

**What are Route Groups?**
- Folders wrapped in parentheses: `(dashboard)`
- **DO NOT** affect URL paths
- **DO** allow shared layouts without URL nesting

**Example:**
```
app/(dashboard)/page.tsx          → URL: /
app/(dashboard)/analytics/page.tsx → URL: /analytics
app/(dashboard)/layout.tsx         → Shared layout for both
```

**Why use them?**
- Multiple pages share sidebar + header
- Clean URLs (`/analytics` not `/dashboard/analytics`)
- Easier code organization

## Component Organization

### By Feature (Domain-Driven)
```
components/
├── signals/        # Everything related to trading signals
├── dashboard/      # Dashboard-specific UI
└── ui/             # Generic primitives
```

### Why This Structure?
- ✅ Easy to find signal-related code
- ✅ Easy to add new features (just create new folder)
- ✅ Clear separation of concerns
- ✅ Scales to 50+ components

## Data Flow

```
User Action
    ↓
Component (signals-table.tsx)
    ↓
Service Layer (signals-service.ts)
    ↓
Supabase Client (lib/supabase/client.ts)
    ↓
Database (PostgreSQL)
```

### Why Services Layer?
- ✅ Centralized data fetching logic
- ✅ Easy to mock for testing
- ✅ Can switch from Supabase to REST API without changing components
- ✅ Reusable across multiple components

## Styling System

### Tailwind v4 Dark Mode
- Permanent dark mode via `<html className="dark">`
- CSS variables in `globals.css`
- No need for `dark:` prefixes (always dark)

### Theme Variables
```css
--background: #0a0a0a       /* Main background */
--surface: #111111          /* Cards, panels */
--surface-hover: #1a1a1a    /* Hover states */
--foreground: #fafafa       /* Primary text */
--muted: #737373            /* Secondary text */
--primary: #3b82f6          /* Blue accent */
--success: #22c55e          /* Green (BUY) */
--danger: #ef4444           /* Red (SELL) */
--warning: #f59e0b          /* Orange (HOLD) */
```

## Key Files

| File | Purpose |
|------|---------|
| `app/(dashboard)/layout.tsx` | Dashboard wrapper with sidebar |
| `components/dashboard/sidebar.tsx` | Main navigation |
| `components/signals/signal-card.tsx` | Hero signal card |
| `lib/services/signals-service.ts` | Data fetching |
| `lib/utils/calculations.ts` | Business logic |
| `types/database.ts` | TypeScript contracts |

## Future Scalability

### Adding New Pages
1. Create `app/(dashboard)/new-page/page.tsx`
2. URL automatically becomes `/new-page`
3. Sidebar shared automatically

### Adding New Features
1. Create `components/new-feature/` folder
2. Add service in `lib/services/new-feature-service.ts`
3. Add types in `types/database.ts`

### Adding New API Endpoints
1. Create `app/api/new-endpoint/route.ts`
2. Export `GET`, `POST`, etc.
3. Use backend libs from `lib/api/`

## Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)

# Build
pnpm build            # Production build
pnpm start            # Start production server

# Quality
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript validation
```

## Notes

- ✅ Zero TypeScript errors
- ✅ All imports use `@/` aliases
- ✅ Build time: ~2s (optimized)
- ✅ Dark mode permanent (no flicker)
- ✅ Fully responsive design
- ✅ Ready for production deployment
