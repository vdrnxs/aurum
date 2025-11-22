import {
  Card,
  Title,
  Text,
  Button,
  Metric,
  Badge,
  Callout,
  Grid,
  Col,
} from '@tremor/react';
import { useCandles } from '../hooks/useCandles';
import { useLatestIndicators } from '../hooks/useIndicators';
import { ToonComparison } from './ToonComparison';

export function SimpleIndicators() {
  const { candles, loading, error, source, isFresh, refetch } = useCandles('BTC', '1h', 100, {
    source: 'auto',
    maxCacheAgeMs: 1 * 60 * 60 * 1000,
  });
  const latest = useLatestIndicators(candles);

  if (loading) {
    return (
      <Card>
        <Title>Loading...</Title>
        <Text>Fetching data from Hyperliquid or Supabase...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Callout title="Error" color="red">
        {error}
        <Button onClick={refetch} className="mt-4">Retry</Button>
      </Callout>
    );
  }

  if (!candles || candles.length === 0) {
    return (
      <Callout title="No Data" color="yellow">
        No candles available
        <Button onClick={refetch} className="mt-4">Load Data</Button>
      </Callout>
    );
  }

  if (!latest) {
    return (
      <Callout title="Not Enough Data" color="yellow">
        Need at least 50 candles. Got: {candles.length}
        <Button onClick={refetch} className="mt-4">Retry</Button>
      </Callout>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between items-center">
          <Title>BTC Indicators (1h)</Title>
          <div className="flex gap-2 items-center">
            <Badge color={source === 'api' ? 'blue' : 'gray'}>{source}</Badge>
            {source === 'cache' && (
              <Badge color={isFresh ? 'green' : 'orange'}>
                {isFresh ? 'fresh' : 'stale'}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <Title>Current Price</Title>
        <Metric>${latest.price.toFixed(2)}</Metric>
        <Text className="mt-2">Based on {candles.length} candles</Text>
      </Card>

      <Card>
        <Title>Trend Indicators (Optimized for 1h)</Title>
        <Grid numItemsSm={2} numItemsLg={5} className="gap-4 mt-4">
          <Col>
            <Card className="h-full">
              <Text className="text-sm font-medium">SMA(20)</Text>
              <Metric className="mt-2">${latest.sma.sma20.toFixed(2)}</Metric>
              <Text className="mt-2 text-xs text-gray-500">~20 hours</Text>
            </Card>
          </Col>
          <Col>
            <Card className="h-full">
              <Text className="text-sm font-medium">SMA(50)</Text>
              <Metric className="mt-2">${latest.sma.sma50.toFixed(2)}</Metric>
              <Text className="mt-2 text-xs text-gray-500">~2 days</Text>
            </Card>
          </Col>
          <Col>
            <Card className="h-full">
              <Text className="text-sm font-medium">EMA(9)</Text>
              <Metric className="mt-2">${latest.ema.ema9.toFixed(2)}</Metric>
              <Text className="mt-2 text-xs text-gray-500">fast</Text>
            </Card>
          </Col>
          <Col>
            <Card className="h-full">
              <Text className="text-sm font-medium">EMA(21)</Text>
              <Metric className="mt-2">${latest.ema.ema21.toFixed(2)}</Metric>
              <Text className="mt-2 text-xs text-gray-500">medium</Text>
            </Card>
          </Col>
          <Col>
            <Card className="h-full">
              <Text className="text-sm font-medium">EMA(50)</Text>
              <Metric className="mt-2">${latest.ema.ema50.toFixed(2)}</Metric>
              <Text className="mt-2 text-xs text-gray-500">slow</Text>
            </Card>
          </Col>
        </Grid>
      </Card>

      <Card>
        <Title>Momentum Indicators</Title>
        <Grid numItemsSm={2} numItemsLg={4} className="gap-4 mt-4">
          <Col>
            <Card className="h-full">
              <Text className="text-sm font-medium">RSI(14)</Text>
              <Metric className="mt-2">{latest.rsi.toFixed(2)}</Metric>
              <Text className="mt-2 text-xs text-gray-500">
                {latest.rsi > 70 ? 'overbought' : latest.rsi < 30 ? 'oversold' : 'neutral'}
              </Text>
            </Card>
          </Col>
          <Col>
            <Card className="h-full">
              <Text className="text-sm font-medium">MACD</Text>
              <Metric className="mt-2">{latest.macd.histogram.toFixed(2)}</Metric>
              <Text className="mt-2 text-xs text-gray-500">(12,26,9) histogram</Text>
            </Card>
          </Col>
          <Col>
            <Card className="h-full">
              <Text className="text-sm font-medium">Stochastic %K</Text>
              <Metric className="mt-2">{latest.stochastic.k.toFixed(2)}</Metric>
              <Text className="mt-2 text-xs text-gray-500">
                {latest.stochastic.k > 80 ? 'overbought' : latest.stochastic.k < 20 ? 'oversold' : 'neutral'}
              </Text>
            </Card>
          </Col>
          <Col>
            <Card className="h-full">
              <Text className="text-sm font-medium">Stochastic %D</Text>
              <Metric className="mt-2">{latest.stochastic.d.toFixed(2)}</Metric>
              <Text className="mt-2 text-xs text-gray-500">signal line</Text>
            </Card>
          </Col>
        </Grid>
      </Card>

      <Card>
        <Title>Volatility & Support/Resistance</Title>
        <Grid numItemsSm={2} numItemsLg={3} className="gap-4 mt-4">
          <Col>
            <Card className="h-full">
              <Text className="text-sm font-medium">Bollinger Bands(20)</Text>
              <Metric className="mt-2 text-lg">
                {latest.bollingerBands.lower.toFixed(0)} - {latest.bollingerBands.upper.toFixed(0)}
              </Metric>
              <Text className="mt-2 text-xs text-gray-500">range</Text>
            </Card>
          </Col>
          <Col>
            <Card className="h-full">
              <Text className="text-sm font-medium">ATR(14)</Text>
              <Metric className="mt-2">${latest.atr.toFixed(2)}</Metric>
              <Text className="mt-2 text-xs text-gray-500">volatility</Text>
            </Card>
          </Col>
          <Col>
            <Card className="h-full">
              <Text className="text-sm font-medium">Parabolic SAR</Text>
              <Metric className="mt-2">${latest.psar.value.toFixed(2)}</Metric>
              <Text className="mt-2 text-xs text-gray-500">
                {latest.psar.trend === 1 ? 'bullish ↑' : latest.psar.trend === -1 ? 'bearish ↓' : 'neutral →'}
              </Text>
            </Card>
          </Col>
        </Grid>
      </Card>

      <ToonComparison candles={candles} symbol="BTC" interval="1h" />
    </div>
  );
}
