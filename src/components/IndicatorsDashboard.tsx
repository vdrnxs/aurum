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
        <Text>No data available for indicators</Text>
      </Card>
    );
  }

  const latestRSI = indicators.rsi14[indicators.rsi14.length - 1];
  const latestMACD = indicators.macd[indicators.macd.length - 1];
  const latestBB = indicators.bb[indicators.bb.length - 1];
  const latestSMA20 = indicators.sma20[indicators.sma20.length - 1];
  const latestSMA50 = indicators.sma50[indicators.sma50.length - 1];

  const getRSIColor = (value: number) => {
    if (value >= 70) return 'red';
    if (value <= 30) return 'green';
    return 'yellow';
  };

  const getTrendBadge = () => {
    if (!latestSMA20 || !latestSMA50) return null;

    if (latestSMA20.value > latestSMA50.value) {
      return <Badge color="green">Bullish</Badge>;
    }
    return <Badge color="red">Bearish</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <Title>Technical Indicators</Title>
        <Text>
          {symbol} - {interval} - Last {limit} candles
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <Text>RSI (14)</Text>
          <Metric>{latestRSI?.value.toFixed(2) || 'N/A'}</Metric>
          <Flex className="mt-2">
            <Badge color={getRSIColor(latestRSI?.value || 50)}>
              {latestRSI?.value >= 70
                ? 'Overbought'
                : latestRSI?.value <= 30
                ? 'Oversold'
                : 'Neutral'}
            </Badge>
          </Flex>
        </Card>

        <Card>
          <Text>MACD</Text>
          <Metric>{latestMACD?.macd.toFixed(2) || 'N/A'}</Metric>
          <Text className="mt-2">
            Signal: {latestMACD?.signal.toFixed(2) || 'N/A'}
          </Text>
          <Text>
            Histogram: {latestMACD?.histogram.toFixed(2) || 'N/A'}
          </Text>
          <Flex className="mt-2">
            <Badge color={latestMACD?.histogram > 0 ? 'green' : 'red'}>
              {latestMACD?.histogram > 0 ? 'Bullish' : 'Bearish'}
            </Badge>
          </Flex>
        </Card>

        <Card>
          <Text>Bollinger Bands</Text>
          <Text className="mt-2">Upper: {latestBB?.upper.toFixed(2)}</Text>
          <Text>Middle: {latestBB?.middle.toFixed(2)}</Text>
          <Text>Lower: {latestBB?.lower.toFixed(2)}</Text>
        </Card>

        <Card>
          <Text>SMA (20)</Text>
          <Metric>{latestSMA20?.value.toFixed(2) || 'N/A'}</Metric>
        </Card>

        <Card>
          <Text>SMA (50)</Text>
          <Metric>{latestSMA50?.value.toFixed(2) || 'N/A'}</Metric>
        </Card>

        <Card>
          <Text>Trend</Text>
          <Flex className="mt-4">{getTrendBadge()}</Flex>
          <Text className="mt-2 text-sm">
            Based on SMA 20/50 crossover
          </Text>
        </Card>
      </div>

      <Card>
        <Title>Indicator Details</Title>
        <div className="mt-4 space-y-2">
          <Text>Total candles analyzed: {candles?.length || 0}</Text>
          <Text>RSI values calculated: {indicators.rsi14.length}</Text>
          <Text>MACD values calculated: {indicators.macd.length}</Text>
          <Text>Bollinger Bands calculated: {indicators.bb.length}</Text>
        </div>
      </Card>
    </div>
  );
}