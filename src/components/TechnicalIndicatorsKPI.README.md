# Technical Indicators KPI Component

## Descripción

Componente React que muestra todos los indicadores técnicos calculados en formato KPI (Key Performance Indicators), organizado por categorías y con badges de estado.

## Archivos Creados

- `src/components/TechnicalIndicatorsKPI.tsx` - Componente principal
- `src/services/indicators.ts` - Funciones para obtener indicadores de Supabase
- `src/pages/IndicatorsPage.tsx` - Página de ejemplo (opcional)

## Características

✅ **20 indicadores técnicos** organizados por categoría:
- Current Price
- Simple Moving Averages (SMA 21, 50, 100)
- Exponential Moving Averages (EMA 12, 21, 55)
- Relative Strength Index (RSI 14, 21)
- MACD (Line, Signal, Histogram)
- Bollinger Bands (Upper, Middle, Lower)
- ATR (Average True Range)
- Parabolic SAR
- Stochastic Oscillator (%K, %D)

✅ **Badges de estado** dinámicos:
- RSI: Overbought (>75), Oversold (<25), Bullish/Bearish
- Stochastic: Overbought (>80), Oversold (<20)
- MACD: Bullish/Bearish según histogram
- PSAR: Uptrend/Downtrend

✅ **Diseño visual balanceado**:
- Grid responsive (3 columnas en desktop, 1 en mobile)
- Espaciado consistente usando design system
- Cards con Metric y Text de Tremor

## Integración

### Opción 1: Agregar al App.tsx existente

Agrega una sección de indicadores debajo del TradingSignalCard:

```tsx
import { TechnicalIndicatorsKPI } from './components/TechnicalIndicatorsKPI';
import { getLatestIndicators } from './services/indicators';

// En tu componente App:
const [indicators, setIndicators] = useState(null);

useEffect(() => {
  async function fetchData() {
    const [signal, history, indicatorsData] = await Promise.all([
      getLatestSignal('BTC', '4h'),
      getSignalHistory('BTC', '4h', 20),
      getLatestIndicators('4h')
    ]);
    setSignal(signal);
    setSignalHistory(history);
    setIndicators(indicatorsData);
  }
  fetchData();
}, []);

// En el JSX, después de TradingSignalCard:
<TechnicalIndicatorsKPI
  indicators={indicators}
  currentPrice={signal?.current_price}
/>
```

### Opción 2: Usar como página separada

Si decides agregar routing (React Router), puedes usar `IndicatorsPage.tsx` directamente:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { IndicatorsPage } from './pages/IndicatorsPage';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<App />} />
    <Route path="/indicators" element={<IndicatorsPage />} />
  </Routes>
</BrowserRouter>
```

### Opción 3: Modal o Tab

Puedes mostrar los indicadores en un tab o modal dentro de la página principal.

## Datos Necesarios

El componente espera un objeto `IndicatorData` con esta estructura:

```typescript
{
  signal_id: number;
  created_at: string;
  price: number;
  sma_21: number;
  sma_50: number;
  sma_100: number;
  ema_12: number;
  ema_21: number;
  ema_55: number;
  rsi_14: number;
  rsi_21: number;
  macd_line: number;
  macd_signal: number;
  macd_histogram: number;
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
  atr: number;
  psar_value: number;
  psar_trend: number;
  stoch_k: number;
  stoch_d: number;
}
```

Estos datos se obtienen automáticamente de la tabla `btc_indicators` en Supabase usando las funciones de `src/services/indicators.ts`.

## Ejemplo de Uso Simple

```tsx
import { TechnicalIndicatorsKPI } from './components/TechnicalIndicatorsKPI';
import { getLatestIndicators } from './services/indicators';

function MyComponent() {
  const [indicators, setIndicators] = useState(null);

  useEffect(() => {
    getLatestIndicators('4h').then(setIndicators);
  }, []);

  return <TechnicalIndicatorsKPI indicators={indicators} />;
}
```

## Dependencias

Usa las mismas dependencias del proyecto:
- `@tremor/react` - UI components (Card, Text, Metric, Badge, Grid)
- `../lib/styles` - Design system (SPACING, TYPOGRAPHY, COLORS)
- Supabase - Para obtener datos de `btc_indicators`

## Estado de Desarrollo

✅ Componente completamente funcional
✅ Integración con Supabase lista
✅ Página de ejemplo incluida
⚠️ Pendiente: Integración en App.tsx (decisión del usuario)

## Próximos Pasos

1. Decidir dónde mostrar los indicadores (misma página, página separada, modal, etc.)
2. Agregar la integración elegida al App.tsx
3. Probar con datos reales después de la próxima ejecución del cron
