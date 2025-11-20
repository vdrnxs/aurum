# Servicio Híbrido - Hyperliquid + Supabase Cache

Sistema inteligente que obtiene datos de Hyperliquid y los almacena en Supabase como cache.

## Estrategia

```
1. ¿Hay datos frescos en Supabase? → SÍ → Usar cache (RÁPIDO)
2. ¿Los datos son viejos (>24h)?     → SÍ → Pedir a Hyperliquid + Guardar en Supabase
3. ¿Hyperliquid falla?                → Usar cache antiguo (fallback)
```

## Uso Básico

### Opción 1: Hook de React (RECOMENDADO)

```typescript
import { useCandles } from '../hooks/useCandles';
import { useLatestIndicators } from '../hooks/useIndicators';

function TradingDashboard() {
  // Automáticamente obtiene datos (cache o API)
  const { candles, loading, error, source, refetch } = useCandles('BTC', '1h', 100);

  // Calcular indicadores
  const latest = useLatestIndicators(candles);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!latest) return <div>No data</div>;

  return (
    <div>
      <p>Source: {source}</p> {/* 'cache' o 'api' */}
      <p>Price: ${latest.price}</p>
      <p>RSI: {latest.rsi}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Opción 2: Servicio directo

```typescript
import { DataService } from '../services/dataService';
import { IndicatorService } from '../services/indicators';

async function analyzeMarket() {
  // 1. Obtener velas (automáticamente usa cache o API)
  const result = await DataService.getCandles('BTC', '1h', 100);

  console.log(`Source: ${result.source}`); // 'cache' o 'api'
  console.log(`Is fresh: ${result.isFresh}`);
  console.log(`Candles: ${result.candles.length}`);

  // 2. Calcular indicadores
  const latest = IndicatorService.getLatestValues(result.candles);

  return latest;
}
```

## Opciones Avanzadas

### Forzar API (ignorar cache)

```typescript
const { candles } = useCandles('BTC', '1h', 100, {
  forceRefresh: true // Siempre pedir a Hyperliquid
});
```

### Solo usar cache

```typescript
const { candles } = useCandles('BTC', '1h', 100, {
  source: 'cache' // Solo leer de Supabase
});
```

### Cambiar tiempo de expiración del cache

```typescript
const { candles } = useCandles('BTC', '1h', 100, {
  maxCacheAgeMs: 12 * 60 * 60 * 1000 // 12 horas en vez de 24h
});
```

### Auto-refresh cada X minutos

```typescript
const { candles } = useCandles('BTC', '1h', 100, {
  refreshInterval: 5 * 60 * 1000 // Actualizar cada 5 minutos
});
```

## Componente Completo

```typescript
import { HybridIndicatorsDashboard } from '../components/HybridIndicatorsDashboard';

function App() {
  return (
    <div>
      <HybridIndicatorsDashboard
        symbol="BTC"
        interval="1h"
        limit={100}
      />
    </div>
  );
}
```

## Flujo de Datos

```
┌─────────────────────────────────────────────┐
│  useCandles('BTC', '1h', 100)               │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  DataService.getCandles()                   │
│  ├─ Revisar cache en Supabase               │
│  ├─ ¿Es fresco? → SÍ → Devolver cache       │
│  └─ ¿Es viejo?  → NO → Pedir a Hyperliquid  │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  HyperliquidService.getCandles()            │
│  ├─ Fetch de API                            │
│  ├─ Convertir formato                       │
│  └─ Devolver velas                          │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  saveCandles()                              │
│  └─ Guardar en Supabase (upsert)            │
└─────────────────────────────────────────────┘
```

## Beneficios

✅ **1 llamada a Hyperliquid por día** (o el tiempo que configures)
✅ **Rápido después de la primera carga** (lee de Supabase)
✅ **Fallback automático** si Hyperliquid falla
✅ **Histórico ilimitado** en Supabase
✅ **Control total** con opciones avanzadas

## Archivos Creados

- [src/services/hyperliquid.ts](hyperliquid.ts) - Llamadas a API de Hyperliquid
- [src/services/dataService.ts](dataService.ts) - Lógica híbrida de cache
- [src/hooks/useCandles.ts](../hooks/useCandles.ts) - Hook de React
- [src/components/HybridIndicatorsDashboard.tsx](../components/HybridIndicatorsDashboard.tsx) - Componente de ejemplo

## Troubleshooting

### "No cached data and API failed"

Significa que:
1. No hay datos en Supabase
2. Hyperliquid API falló

**Solución:** Verifica tu conexión y la URL de Hyperliquid API

### "Need at least 50 candles"

No hay suficientes velas para calcular indicadores.

**Solución:** Usa `limit={100}` o más

### Los datos no se actualizan

Estás usando cache viejo. Opciones:
1. Espera 24h (o el tiempo configurado)
2. Usa `forceRefresh: true`
3. Llama a `refetch()`

## Próximos Pasos

1. Integrar con IA para análisis automático
2. Agregar alertas cuando RSI > 70 o < 30
3. Crear sistema de notificaciones
4. Implementar backtesting