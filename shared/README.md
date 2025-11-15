# Shared Types

This folder contains TypeScript types shared between frontend and backend.

## Files

- `types.ts` - Database and API type definitions

## Usage

### Frontend
```typescript
import type { Candle, CandleInterval } from '../../shared/types';
```

### Backend
```typescript
import type { HyperliquidCandle, CandleInsert } from '../shared/types.js';
```

## Why Shared?

Keeping types in one place ensures:
- No duplication between frontend and backend
- Single source of truth for data structures
- Easier refactoring and maintenance
