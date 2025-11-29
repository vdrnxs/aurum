# Supabase Database Schema

Este directorio contiene el schema completo de la base de datos de Aurum.

## Archivo principal

- `init.sql` - Schema completo de la base de datos (pendiente de crear)

## Estructura de la base de datos

### Tablas

1. **candles** - Cache temporal de velas OHLCV (24h)
   - Datos de Hyperliquid
   - Se limpia automáticamente cada 24h

2. **btc_trading_signals** - Señales de trading generadas por IA
   - BUY, SELL, HOLD, STRONG_BUY, STRONG_SELL
   - Incluye SL, TP, entry price, confidence
   - Generadas cada 4 horas por cron

3. **btc_indicators** - Indicadores técnicos
   - 20 indicadores: SMA, EMA, RSI, MACD, BB, ATR, PSAR, Stochastic
   - Relación 1-to-1 con btc_trading_signals (FK)

## Cómo recrear la base de datos

1. Ve a tu Supabase Dashboard
2. Abre **SQL Editor**
3. Copia y pega el contenido de `init.sql`
4. Ejecuta el script

## Exportar schema actual (para actualizar init.sql)

Desde Supabase Dashboard → SQL Editor, ejecuta:

```sql
-- Ver estructura de tablas
\d+ candles
\d+ btc_trading_signals
\d+ btc_indicators

-- Ver políticas RLS
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Ver funciones
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- Ver índices
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public';
```

O usa el método de export desde Database → Tables → Export SQL.

## Seguridad (RLS)

- **Frontend (anon key)**: Solo puede SELECT (leer datos)
- **Backend (service_role)**: Puede INSERT/UPDATE/DELETE (bypasea RLS)

## Funciones importantes

- `cleanup_old_candles()` - Borra velas >24h
- `cleanup_old_btc_signals()` - Borra señales >30 días
- `get_latest_btc_signal(interval)` - Obtiene última señal
- `get_btc_signal_history(interval, limit)` - Obtiene historial

## Cron jobs configurados

- **Candles cleanup**: Diario a las 00:00 UTC
- **Signals cleanup**: Diario a las 01:00 UTC

---

**Próximo paso**: Exportar schema desde Supabase y crear `init.sql` definitivo.