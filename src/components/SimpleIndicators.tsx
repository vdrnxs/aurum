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

      <Grid numItemsSm={2} numItemsLg={5} className="gap-4">
        <Col>
          <Card className="h-full">
            <Text className="text-sm font-medium">SMA(100)</Text>
            <Metric className="mt-2">${latest.sma100.toFixed(2)}</Metric>
            <Text className="mt-2 text-xs text-gray-500">~4 days</Text>
          </Card>
        </Col>
        <Col>
          <Card className="h-full">
            <Text className="text-sm font-medium">RSI(14)</Text>
            <Metric className="mt-2">{latest.rsi.toFixed(2)}</Metric>
            <Text className="mt-2 text-xs text-gray-500">standard</Text>
          </Card>
        </Col>
        <Col>
          <Card className="h-full">
            <Text className="text-sm font-medium">MACD</Text>
            <Metric className="mt-2">{latest.macd.histogram.toFixed(2)}</Metric>
            <Text className="mt-2 text-xs text-gray-500">(24,52,9) histogram</Text>
          </Card>
        </Col>
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
      </Grid>

      <ToonComparison candles={candles} symbol="BTC" interval="1h" />
    </div>
  );
}
