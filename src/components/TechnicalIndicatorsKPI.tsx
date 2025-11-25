import { Card, Text, Metric, Grid, Badge } from '@tremor/react';
import { SPACING, TYPOGRAPHY } from '../lib/styles';
import type { IndicatorData } from '../services/indicators';

interface TechnicalIndicatorsKPIProps {
  indicators: IndicatorData | null;
  currentPrice?: number;
}

export function TechnicalIndicatorsKPI({ indicators, currentPrice }: TechnicalIndicatorsKPIProps) {
  if (!indicators) {
    return (
      <Card className={SPACING.p.lg}>
        <Text>No indicator data available</Text>
      </Card>
    );
  }

  const formatPrice = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatValue = (value: number, decimals: number = 2) => value.toFixed(decimals);

  // Helper to determine RSI status
  const getRSIStatus = (rsi: number) => {
    if (rsi > 75) return { label: 'Overbought', color: 'red' as const };
    if (rsi < 25) return { label: 'Oversold', color: 'green' as const };
    if (rsi > 50) return { label: 'Bullish', color: 'emerald' as const };
    if (rsi < 50) return { label: 'Bearish', color: 'rose' as const };
    return { label: 'Neutral', color: 'gray' as const };
  };

  // Helper to determine Stochastic status
  const getStochStatus = (k: number) => {
    if (k > 80) return { label: 'Overbought', color: 'red' as const };
    if (k < 20) return { label: 'Oversold', color: 'green' as const };
    return { label: 'Neutral', color: 'gray' as const };
  };

  // Helper to determine MACD signal
  const getMACDSignal = (histogram: number) => {
    if (histogram > 0) return { label: 'Bullish', color: 'green' as const };
    if (histogram < 0) return { label: 'Bearish', color: 'red' as const };
    return { label: 'Neutral', color: 'gray' as const };
  };

  // Helper to determine PSAR trend
  const getPSARTrend = (trend: number) => {
    if (trend === 1) return { label: 'Uptrend', color: 'green' as const };
    if (trend === -1) return { label: 'Downtrend', color: 'red' as const };
    return { label: 'Neutral', color: 'gray' as const };
  };

  const price = currentPrice ?? indicators.price;

  return (
    <div className="space-y-6">
      {/* Current Price */}
      <Card className={SPACING.p.lg}>
        <Text className={TYPOGRAPHY.sm}>Current Price</Text>
        <Metric className="text-4xl mt-1">{formatPrice(price)}</Metric>
      </Card>

      {/* Simple Moving Averages (SMA) */}
      <div>
        <Text className={`${TYPOGRAPHY.emphasis} mb-3`}>Simple Moving Averages (SMA)</Text>
        <Grid numItemsMd={3} className="gap-4">
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>SMA 21</Text>
            <Metric className="mt-1">{formatPrice(indicators.sma_21)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-1`}>
              {price > indicators.sma_21 ? '↑ Above' : '↓ Below'}
            </Text>
          </Card>
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>SMA 50</Text>
            <Metric className="mt-1">{formatPrice(indicators.sma_50)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-1`}>
              {price > indicators.sma_50 ? '↑ Above' : '↓ Below'}
            </Text>
          </Card>
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>SMA 100</Text>
            <Metric className="mt-1">{formatPrice(indicators.sma_100)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-1`}>
              {price > indicators.sma_100 ? '↑ Above' : '↓ Below'}
            </Text>
          </Card>
        </Grid>
      </div>

      {/* Exponential Moving Averages (EMA) */}
      <div>
        <Text className={`${TYPOGRAPHY.emphasis} mb-3`}>Exponential Moving Averages (EMA)</Text>
        <Grid numItemsMd={3} className="gap-4">
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>EMA 12</Text>
            <Metric className="mt-1">{formatPrice(indicators.ema_12)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-1`}>Short-term</Text>
          </Card>
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>EMA 21</Text>
            <Metric className="mt-1">{formatPrice(indicators.ema_21)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-1`}>Weekly trend</Text>
          </Card>
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>EMA 55</Text>
            <Metric className="mt-1">{formatPrice(indicators.ema_55)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-1`}>Long-term</Text>
          </Card>
        </Grid>
      </div>

      {/* Relative Strength Index (RSI) */}
      <div>
        <Text className={`${TYPOGRAPHY.emphasis} mb-3`}>Relative Strength Index (RSI)</Text>
        <Grid numItemsMd={2} className="gap-4">
          <Card className={SPACING.p.md}>
            <div className="flex justify-between items-start">
              <div>
                <Text className={TYPOGRAPHY.sm}>RSI 14</Text>
                <Metric className="mt-1">{formatValue(indicators.rsi_14)}</Metric>
              </div>
              <Badge color={getRSIStatus(indicators.rsi_14).color} size="sm">
                {getRSIStatus(indicators.rsi_14).label}
              </Badge>
            </div>
            <Text className={`${TYPOGRAPHY.xs} mt-2`}>Standard period</Text>
          </Card>
          <Card className={SPACING.p.md}>
            <div className="flex justify-between items-start">
              <div>
                <Text className={TYPOGRAPHY.sm}>RSI 21</Text>
                <Metric className="mt-1">{formatValue(indicators.rsi_21)}</Metric>
              </div>
              <Badge color={getRSIStatus(indicators.rsi_21).color} size="sm">
                {getRSIStatus(indicators.rsi_21).label}
              </Badge>
            </div>
            <Text className={`${TYPOGRAPHY.xs} mt-2`}>Confirmation</Text>
          </Card>
        </Grid>
      </div>

      {/* MACD */}
      <div>
        <Text className={`${TYPOGRAPHY.emphasis} mb-3`}>MACD (Moving Average Convergence Divergence)</Text>
        <Grid numItemsMd={3} className="gap-4">
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>MACD Line</Text>
            <Metric className="mt-1">{formatValue(indicators.macd_line, 4)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-1`}>Fast EMA - Slow EMA</Text>
          </Card>
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>Signal Line</Text>
            <Metric className="mt-1">{formatValue(indicators.macd_signal, 4)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-1`}>9-period EMA</Text>
          </Card>
          <Card className={SPACING.p.md}>
            <div className="flex justify-between items-start">
              <div>
                <Text className={TYPOGRAPHY.sm}>Histogram</Text>
                <Metric className="mt-1">{formatValue(indicators.macd_histogram, 4)}</Metric>
              </div>
              <Badge color={getMACDSignal(indicators.macd_histogram).color} size="sm">
                {getMACDSignal(indicators.macd_histogram).label}
              </Badge>
            </div>
            <Text className={`${TYPOGRAPHY.xs} mt-2`}>MACD - Signal</Text>
          </Card>
        </Grid>
      </div>

      {/* Bollinger Bands */}
      <div>
        <Text className={`${TYPOGRAPHY.emphasis} mb-3`}>Bollinger Bands</Text>
        <Grid numItemsMd={3} className="gap-4">
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>Upper Band</Text>
            <Metric className="mt-1">{formatPrice(indicators.bb_upper)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-1`}>Resistance level</Text>
          </Card>
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>Middle Band</Text>
            <Metric className="mt-1">{formatPrice(indicators.bb_middle)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-1`}>20-period SMA</Text>
          </Card>
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>Lower Band</Text>
            <Metric className="mt-1">{formatPrice(indicators.bb_lower)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-1`}>Support level</Text>
          </Card>
        </Grid>
      </div>

      {/* Volatility & Timing Indicators */}
      <div>
        <Text className={`${TYPOGRAPHY.emphasis} mb-3`}>Volatility & Timing</Text>
        <Grid numItemsMd={2} className="gap-4">
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>ATR (Average True Range)</Text>
            <Metric className="mt-1">{formatPrice(indicators.atr)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-2`}>Volatility measure (14-period)</Text>
          </Card>
          <Card className={SPACING.p.md}>
            <div className="flex justify-between items-start">
              <div>
                <Text className={TYPOGRAPHY.sm}>Parabolic SAR</Text>
                <Metric className="mt-1">{formatPrice(indicators.psar_value)}</Metric>
              </div>
              <Badge color={getPSARTrend(indicators.psar_trend).color} size="sm">
                {getPSARTrend(indicators.psar_trend).label}
              </Badge>
            </div>
            <Text className={`${TYPOGRAPHY.xs} mt-2`}>Stop and Reverse</Text>
          </Card>
        </Grid>
      </div>

      {/* Stochastic Oscillator */}
      <div>
        <Text className={`${TYPOGRAPHY.emphasis} mb-3`}>Stochastic Oscillator</Text>
        <Grid numItemsMd={2} className="gap-4">
          <Card className={SPACING.p.md}>
            <div className="flex justify-between items-start">
              <div>
                <Text className={TYPOGRAPHY.sm}>%K (Fast)</Text>
                <Metric className="mt-1">{formatValue(indicators.stoch_k)}</Metric>
              </div>
              <Badge color={getStochStatus(indicators.stoch_k).color} size="sm">
                {getStochStatus(indicators.stoch_k).label}
              </Badge>
            </div>
            <Text className={`${TYPOGRAPHY.xs} mt-2`}>Current momentum</Text>
          </Card>
          <Card className={SPACING.p.md}>
            <Text className={TYPOGRAPHY.sm}>%D (Slow)</Text>
            <Metric className="mt-1">{formatValue(indicators.stoch_d)}</Metric>
            <Text className={`${TYPOGRAPHY.xs} mt-2`}>3-period SMA of %K</Text>
          </Card>
        </Grid>
      </div>
    </div>
  );
}
