# Plan de Implementación: Sistema de Evaluación de Señales

## Decisiones Finales

### 1. Verificación de Señales
- **Frecuencia**: Cada 4h (mismo cron que `analyze-signals`)
- **Endpoint**: `/api/evaluate-signals.ts` (separado)
- **Intervalo de velas**: 15m (16 velas por verificación de 4h)
- **Verificación incremental**: ✅ Solo últimas 4h desde `last_checked_at`
- **Símbolos a verificar**: Solo señales con `outcome='OPEN'` y `signal IN ('BUY', 'SELL', 'STRONG_BUY', 'STRONG_SELL')`

### 2. Lógica de Cierre de Señales

#### Regla de SL/TP en la misma vela
Si una vela toca tanto SL como TP en la misma vela de 15m:
- **Outcome**: `INVALID` (nueva categoría)
- **Razón**: No se puede determinar con certeza qué se alcanzó primero
- **Métrica**: Guardar contador de señales inválidas para análisis de precisión
- **P&L**: No contabilizar en cálculos de rentabilidad (excluir del win rate)

#### Outcomes posibles
- `OPEN`: Señal activa, aún no cerrada
- `TP_HIT`: Take Profit alcanzado
- `SL_HIT`: Stop Loss alcanzado
- `INVALID`: SL y TP tocados en la misma vela (imprecisión)
- `EXPIRED`: Señal expiró sin tocar SL ni TP

#### Regla de expiración
- **Señales normales** (BUY/SELL): 48h
- **Señales fuertes** (STRONG_BUY/STRONG_SELL): 24h
- **Acción**: Cerrar al precio actual de mercado con outcome `EXPIRED`

### 3. Cálculo de P&L
- **Capital inicial**: $10,000 (hardcoded por ahora)
- **Posición por trade**: 10% fijo ($1,000 por señal)
- **Estrategia**: Lot fijo (después se optimizará)

### 4. Gráficos y Visualizaciones

#### ✅ Gráfico Circular (DonutChart)
Mostrar distribución de outcomes:
- TP Hit (verde)
- SL Hit (rojo)
- Open (gris)
- Invalid (amarillo/naranja)
- Expired (gris oscuro)

**Métricas clave**:
- Win Rate: `TP_HIT / (TP_HIT + SL_HIT)` (excluye INVALID y EXPIRED)
- Precision Rate: `(TP_HIT + SL_HIT) / TOTAL` (mide cuántas NO son INVALID)

#### ❌ Gráfico de Línea P&L
**DESCARTADO** por ahora (complejidad con señales simultáneas)

### 5. Campos Nuevos en Base de Datos

```sql
ALTER TABLE trading_signals ADD COLUMN IF NOT EXISTS
  outcome TEXT DEFAULT 'OPEN' CHECK (outcome IN ('OPEN', 'TP_HIT', 'SL_HIT', 'INVALID', 'EXPIRED')),
  close_price DECIMAL(12,2),
  close_timestamp TIMESTAMPTZ,
  pnl_percentage DECIMAL(6,2),
  pnl_usd DECIMAL(12,2),
  highest_price DECIMAL(12,2),
  lowest_price DECIMAL(12,2),
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  is_valid BOOLEAN DEFAULT TRUE; -- false si outcome='INVALID'

CREATE INDEX idx_signals_outcome ON trading_signals(outcome);
CREATE INDEX idx_signals_open ON trading_signals(outcome) WHERE outcome = 'OPEN';
```

### 6. Pseudocódigo de Verificación

```typescript
// /api/evaluate-signals.ts

1. Fetch señales abiertas:
   SELECT * FROM trading_signals
   WHERE outcome = 'OPEN'
   AND signal IN ('BUY', 'SELL', 'STRONG_BUY', 'STRONG_SELL')

2. Para cada señal abierta:
   a. Verificar si expiró (24h/48h según tipo)
   b. Si expiró → cerrar con outcome='EXPIRED', close_price=current_price
   c. Si NO expiró:
      - Fetch velas 15m desde last_checked_at hasta NOW
      - Para cada vela verificar:
        * ¿Toca SL?
        * ¿Toca TP?
        * ¿Toca ambos? → outcome='INVALID'
      - Update last_checked_at = NOW()

3. Guardar resultados en Supabase
```

### 7. Cron Job

```yaml
# .github/workflows/trading-signals.yml

name: Trading Signals Pipeline

on:
  schedule:
    - cron: '0 */4 * * *'  # 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
  workflow_dispatch:

jobs:
  trading-pipeline:
    runs-on: ubuntu-latest
    steps:
      - name: Generate new signals
        run: |
          curl -X POST https://aurum.vercel.app/api/analyze-signals \
            -H "Content-Type: application/json" \
            -d '{"symbols": ["BTC"], "interval": "4h", "limit": 100}'

      - name: Wait for signals to save
        run: sleep 30

      - name: Evaluate open signals
        run: |
          curl -X POST https://aurum.vercel.app/api/evaluate-signals
```

### 8. Componentes Frontend

#### WinRateDonut.tsx
- Tremor DonutChart
- Datos: outcomes agrupados
- Centro: "Win Rate: XX%"
- Leyenda: TP Hit, SL Hit, Open, Invalid, Expired

#### SignalPerformanceTable.tsx (mejorada)
Añadir columnas:
- Outcome (badge color-coded)
- P&L USD
- P&L %
- Close Timestamp
- Duration (tiempo hasta cerrar)

### 9. Orden de Implementación

1. **Schema update** (`supabase/schema-signals.sql`)
2. **Backend** (`/api/evaluate-signals.ts`)
3. **Types** (`src/types/database.ts`) - añadir nuevos outcomes
4. **Cron job** (`.github/workflows/trading-signals.yml`)
5. **Frontend components**:
   - `WinRateDonut.tsx`
   - Update `SignalPerformanceTable.tsx`
6. **Testing manual** (trigger cron, verificar datos)

### 10. Métricas a Mostrar en UI

- **Win Rate**: TP_HIT / (TP_HIT + SL_HIT)
- **Total Signals**: Count(*)
- **Valid Signals**: Count WHERE outcome != 'INVALID'
- **Precision Rate**: (TP_HIT + SL_HIT) / TOTAL
- **Open Signals**: Count WHERE outcome = 'OPEN'
- **Average P&L per Trade**: AVG(pnl_usd) WHERE outcome IN ('TP_HIT', 'SL_HIT')

### 11. Notas Importantes

- NO guardar velas 15m en Supabase (solo fetch on-demand)
- Señales HOLD nunca se verifican (no tienen SL/TP)
- Verificación incremental: solo últimas 4h (eficiencia)
- Priorizar data quality: señales INVALID son información valiosa
- Después de 48h/24h, cerrar con EXPIRED (no dejar señales abiertas infinitamente)

## Estado Actual
- [ ] Schema actualizado
- [ ] Backend evaluate-signals implementado
- [ ] Types actualizados
- [ ] Cron job configurado
- [ ] Frontend WinRateDonut
- [ ] Frontend SignalPerformanceTable mejorado
- [ ] Testing completo