# Technical Indicators Guide

This guide shows how to use technical indicators in Aurum using `indicatorts`.

## Overview

The `IndicatorService` provides methods to calculate various technical indicators from OHLCV candle data.

## Available Indicators

### Trend Indicators
- **SMA (Simple Moving Average)**: Smooths price data to identify trends
- **EMA (Exponential Moving Average)**: Gives more weight to recent prices

### Momentum Indicators
- **RSI (Relative Strength Index)**: Measures overbought/oversold conditions (0-100)
- **MACD (Moving Average Convergence Divergence)**: Shows momentum and trend changes

### Volatility Indicators
- **Bollinger Bands**: Shows price volatility and potential support/resistance
- **ATR (Average True Range)**: Measures market volatility

### Other Indicators
- **Stochastic Oscillator**: Compares closing price to price range
- **ADX (Average Directional Index)**: Measures trend strength
- **CCI (Commodity Channel Index)**: Identifies cyclical trends

## Usage Examples

### Basic Usage with Service

```typescript
import { IndicatorService } from '../services/indicators';
import { getLatestCandles } from '../services/candles';

// Fetch candles from Supabase
const candles = await getLatestCandles('BTC', '1h', 100);

// Calculate single indicator
const sma20 = IndicatorService.calculateSMA(candles, 20);
const rsi14 = IndicatorService.calculateRSI(candles, 14);
const macd = IndicatorService.calculateMACD(candles);

// Calculate multiple indicators at once
const indicators = IndicatorService.calculateMultipleIndicators(candles);
console.log(indicators.sma20);
console.log(indicators.rsi14);
console.log(indicators.macd);
```

### Using React Hooks

```typescript
import { useIndicators, useRSI, useMACD } from '../hooks/useIndicators';
import { useState, useEffect } from 'react';
import { getLatestCandles } from '../services/candles';

function MyComponent() {
  const [candles, setCandles] = useState(null);

  useEffect(() => {
    getLatestCandles('BTC', '1h', 100).then(setCandles);
  }, []);

  // Calculate all indicators
  const indicators = useIndicators(candles);

  // Or calculate specific indicators
  const rsi = useRSI(candles, 14);
  const macd = useMACD(candles);

  if (!indicators) return <div>Loading...</div>;

  return (
    <div>
      <p>Latest RSI: {indicators.rsi14[indicators.rsi14.length - 1]?.value}</p>
      <p>Latest MACD: {indicators.macd[indicators.macd.length - 1]?.macd}</p>
    </div>
  );
}
```

### Using the Dashboard Component

```typescript
import { IndicatorsDashboard } from '../components/IndicatorsDashboard';

function App() {
  return (
    <div>
      <IndicatorsDashboard symbol="BTC" interval="1h" limit={100} />
    </div>
  );
}
```

## Indicator Details

### RSI (Relative Strength Index)
- **Range**: 0-100
- **Overbought**: > 70
- **Oversold**: < 30
- **Default Period**: 14

```typescript
const rsi = IndicatorService.calculateRSI(candles, 14);
const latestRSI = rsi[rsi.length - 1];

if (latestRSI.value > 70) {
  console.log('Overbought - potential sell signal');
} else if (latestRSI.value < 30) {
  console.log('Oversold - potential buy signal');
}
```

### MACD
- **Components**: MACD line, Signal line, Histogram
- **Default Periods**: 12 (fast), 26 (slow), 9 (signal)

```typescript
const macd = IndicatorService.calculateMACD(candles, 12, 26, 9);
const latest = macd[macd.length - 1];

if (latest.histogram > 0) {
  console.log('Bullish momentum');
} else {
  console.log('Bearish momentum');
}

// Check for crossover
if (latest.macd > latest.signal) {
  console.log('MACD above signal - potential buy');
}
```

### Bollinger Bands
- **Components**: Upper band, Middle band (SMA), Lower band
- **Default**: 20-period SMA, 2 standard deviations

```typescript
const bb = IndicatorService.calculateBollingerBands(candles, 20, 2);
const latest = bb[bb.length - 1];
const currentPrice = candles[candles.length - 1].close;

if (currentPrice > latest.upper) {
  console.log('Price above upper band - overbought');
} else if (currentPrice < latest.lower) {
  console.log('Price below lower band - oversold');
}
```

### Moving Averages (SMA/EMA)

```typescript
const sma20 = IndicatorService.calculateSMA(candles, 20);
const sma50 = IndicatorService.calculateSMA(candles, 50);

const latest20 = sma20[sma20.length - 1];
const latest50 = sma50[sma50.length - 1];

// Golden Cross / Death Cross
if (latest20.value > latest50.value) {
  console.log('Bullish trend - SMA20 above SMA50');
} else {
  console.log('Bearish trend - SMA20 below SMA50');
}
```

## Trading Strategies

### Example: RSI + MACD Confirmation

```typescript
const candles = await getLatestCandles('BTC', '1h', 100);
const rsi = IndicatorService.calculateRSI(candles, 14);
const macd = IndicatorService.calculateMACD(candles);

const latestRSI = rsi[rsi.length - 1];
const latestMACD = macd[macd.length - 1];

// Buy signal: RSI oversold + MACD bullish
if (latestRSI.value < 30 && latestMACD.histogram > 0) {
  console.log('Strong buy signal');
}

// Sell signal: RSI overbought + MACD bearish
if (latestRSI.value > 70 && latestMACD.histogram < 0) {
  console.log('Strong sell signal');
}
```

## Performance Tips

1. **Cache calculations**: Indicators are calculated using `useMemo` in hooks
2. **Batch processing**: Use `calculateMultipleIndicators()` for multiple indicators
3. **Data requirements**: Ensure you have enough candles for the indicator period
4. **Real-time updates**: Subscribe to candle updates and recalculate indicators

## Minimum Data Requirements

- **SMA/EMA**: At least `period` candles
- **RSI**: At least `period + 1` candles
- **MACD**: At least `slowPeriod` candles (default: 26)
- **Bollinger Bands**: At least `period` candles (default: 20)
- **ATR**: At least `period + 1` candles

## Next Steps

1. Store calculated indicators in Supabase (new table)
2. Create real-time indicator updates
3. Build custom trading strategies
4. Implement backtesting framework
5. Add alerts based on indicator signals