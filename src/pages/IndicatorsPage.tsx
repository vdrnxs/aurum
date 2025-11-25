import { useEffect, useState } from 'react';
import { Card, Title, Text } from '@tremor/react';
import { AppLayout } from '../layouts/AppLayout';
import { TechnicalIndicatorsKPI } from '../components/TechnicalIndicatorsKPI';
import { getLatestIndicators, type IndicatorData } from '../services/indicators';
import { getLatestSignal } from '../services/signals';
import { SPACING } from '../lib/styles';

export function IndicatorsPage() {
  const [indicators, setIndicators] = useState<IndicatorData | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch latest indicators
        const indicatorsData = await getLatestIndicators('4h');

        if (!indicatorsData) {
          setError('No indicator data available. Wait for the next signal generation.');
          return;
        }

        setIndicators(indicatorsData);

        // Fetch current price from latest signal
        const latestSignal = await getLatestSignal('4h');
        if (latestSignal?.current_price) {
          setCurrentPrice(latestSignal.current_price);
        }
      } catch (err) {
        console.error('Error fetching indicators:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={SPACING.mb.xl}>
          <Title>Technical Indicators Dashboard</Title>
          <Text className={SPACING.mt.sm}>
            Real-time technical indicators for BTC/USD on 4h timeframe
          </Text>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className={SPACING.p.lg}>
            <Text>Loading indicators...</Text>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className={SPACING.p.lg}>
            <Text className="text-red-600">{error}</Text>
          </Card>
        )}

        {/* Indicators Display */}
        {!loading && !error && indicators && (
          <TechnicalIndicatorsKPI
            indicators={indicators}
            currentPrice={currentPrice}
          />
        )}
      </div>
    </AppLayout>
  );
}
