import { Card, Title, Text, Metric, Flex, Badge, Button } from '@tremor/react';
import type { CandleInterval, CryptoSymbol } from '../types/database';
import { useCandles } from '../hooks/useCandles';
import { useLatestIndicators } from '../hooks/useIndicators';

interface HybridIndicatorsDashboardProps {
  symbol?: CryptoSymbol;
  interval?: CandleInterval;
  limit?: number;
}

export function HybridIndicatorsDashboard({
  symbol = 'BTC',
  interval = '1h',
  limit = 100,
}: HybridIndicatorsDashboardProps) {
  const {
    candles,
    loading,
    error,
    source,
    isFresh,
    timestamp,
    refetch,
  } = useCandles(symbol, interval, limit);

  const latest = useLatestIndicators(candles);

  if (loading) {
    return (
      <Card>
        <Text>Loading data...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Title>Error</Title>
        <Text className="mt-2">{error}</Text>
        <Button onClick={refetch} className="mt-4">
          Retry
        </Button>
      </Card>
    );
  }

  if (!latest || !candles) {
    return (
      <Card>
        <Text>Need at least 50 candles to calculate indicators</Text>
        <Button onClick={refetch} className="mt-4">
          Load Data
        </Button>
      </Card>
    );
  }

  const getRSIColor = (value: number) => {
    if (value >= 70) return 'red';
    if (value <= 30) return 'green';
    return 'yellow';
  };

  const getRSISignal = (value: number) => {
    if (value >= 70) return 'Overbought';
    if (value <= 30) return 'Oversold';
    return 'Neutral';
  };

  const getTrendBadge = () => {
    if (latest.price > latest.sma100) {
      return <Badge color="green">Above SMA100</Badge>;
    }
    return <Badge color="red">Below SMA100</Badge>;
  };

  const getSourceBadge = () => {
    if (source === 'api') {
      return <Badge color="blue">Fresh from API</Badge>;
    }
    return <Badge color="gray">From Cache</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title>Technical Indicators</Title>
          <Text>
            {symbol} - {interval} - {candles.length} candles
          </Text>
        </div>
        <div className="flex gap-2 items-center">
          {getSourceBadge()}
          <Button size="xs" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {timestamp && (
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <Text>Data Status</Text>
              <Metric>
                {isFresh ? 'Fresh' : 'Stale'}
              </Metric>
            </div>
            <div className="text-right">
              <Text>Last Update</Text>
              <Text className="font-semibold">
                {new Date(timestamp).toLocaleString()}
              </Text>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Text>Current Price</Text>
          <Metric>${latest.price.toFixed(2)}</Metric>
        </Card>

        <Card>
          <Text>SMA (100)</Text>
          <Metric>${latest.sma100.toFixed(2)}</Metric>
          <Flex className="mt-2">{getTrendBadge()}</Flex>
        </Card>

        <Card>
          <Text>RSI (14)</Text>
          <Metric>{latest.rsi.toFixed(2)}</Metric>
          <Flex className="mt-2">
            <Badge color={getRSIColor(latest.rsi)}>
              {getRSISignal(latest.rsi)}
            </Badge>
          </Flex>
        </Card>
      </div>

      <Card>
        <Title>MACD</Title>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <Text>MACD Line</Text>
            <Metric>{latest.macd.line.toFixed(2)}</Metric>
          </div>
          <div>
            <Text>Signal Line</Text>
            <Metric>{latest.macd.signal.toFixed(2)}</Metric>
          </div>
          <div>
            <Text>Histogram</Text>
            <Metric>{latest.macd.histogram.toFixed(2)}</Metric>
            <Flex className="mt-2">
              <Badge color={latest.macd.histogram > 0 ? 'green' : 'red'}>
                {latest.macd.histogram > 0 ? 'Bullish' : 'Bearish'}
              </Badge>
            </Flex>
          </div>
        </div>
      </Card>

      <Card>
        <Title>Data for AI Analysis</Title>
        <pre className="mt-4 p-4 bg-gray-50 rounded text-xs overflow-x-auto">
          {JSON.stringify(latest, null, 2)}
        </pre>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(latest, null, 2));
          }}
          className="mt-4"
          size="xs"
        >
          Copy to Clipboard
        </Button>
      </Card>
    </div>
  );
}