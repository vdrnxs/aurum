import { useEffect, useState } from 'react';
import { Card, Title, Text, Metric, Flex, Badge } from '@tremor/react';
import type { Candle, CandleInterval } from '../types/database';
import { useIndicators } from '../hooks/useIndicators';
import { getLatestCandles } from '../services/candles';

interface IndicatorsDashboardProps {
  symbol?: string;
  interval?: CandleInterval;
  limit?: number;
}

export function IndicatorsDashboard({
  symbol = 'BTC',
  interval = '1h',
  limit = 100,
}: IndicatorsDashboardProps) {
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const indicators = useIndicators(candles);

  useEffect(() => {
    const fetchCandles = async () => {
      try {
        setLoading(true);
        const data = await getLatestCandles(symbol, interval, limit);
        setCandles(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading candles');
      } finally {
        setLoading(false);
      }
    };

    fetchCandles();
  }, [symbol, interval, limit]);

  if (loading) {
    return (
      <Card>
        <Text>Loading indicators...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Text>Error: {error}</Text>
      </Card>
    );
  }

  if (!indicators) {
    return (
      <Card>
        <Text>Need at least 50 candles to calculate indicators</Text>
      </Card>
    );
  }

  const currentPrice = candles![candles!.length - 1].close;
  const latestRSI = indicators.rsi14[indicators.rsi14.length - 1];
  const latestMACD = indicators.macd[indicators.macd.length - 1];
  const latestSMA100 = indicators.sma100[indicators.sma100.length - 1];

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
    if (currentPrice > latestSMA100.value) {
      return <Badge color="green">Above SMA100</Badge>;
    }
    return <Badge color="red">Below SMA100</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <Title>Technical Indicators</Title>
        <Text>
          {symbol} - {interval} - Last {limit} candles
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Text>Current Price</Text>
          <Metric>${currentPrice.toFixed(2)}</Metric>
        </Card>

        <Card>
          <Text>SMA (100)</Text>
          <Metric>${latestSMA100.value.toFixed(2)}</Metric>
          <Flex className="mt-2">{getTrendBadge()}</Flex>
        </Card>

        <Card>
          <Text>RSI (14)</Text>
          <Metric>{latestRSI.value.toFixed(2)}</Metric>
          <Flex className="mt-2">
            <Badge color={getRSIColor(latestRSI.value)}>
              {getRSISignal(latestRSI.value)}
            </Badge>
          </Flex>
        </Card>
      </div>

      <Card>
        <Title>MACD</Title>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <Text>MACD Line</Text>
            <Metric>{latestMACD.macd.toFixed(2)}</Metric>
          </div>
          <div>
            <Text>Signal Line</Text>
            <Metric>{latestMACD.signal.toFixed(2)}</Metric>
          </div>
          <div>
            <Text>Histogram</Text>
            <Metric>{latestMACD.histogram.toFixed(2)}</Metric>
            <Flex className="mt-2">
              <Badge color={latestMACD.histogram > 0 ? 'green' : 'red'}>
                {latestMACD.histogram > 0 ? 'Bullish' : 'Bearish'}
              </Badge>
            </Flex>
          </div>
        </div>
      </Card>

      <Card>
        <Title>Summary</Title>
        <div className="mt-4 space-y-2">
          <Text>Total candles analyzed: {candles?.length || 0}</Text>
          <Text>SMA values: {indicators.sma100.length}</Text>
          <Text>RSI values: {indicators.rsi14.length}</Text>
          <Text>MACD values: {indicators.macd.length}</Text>
        </div>
      </Card>
    </div>
  );
}