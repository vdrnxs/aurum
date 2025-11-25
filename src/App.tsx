import { useEffect, useState } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { TradingSignalCard } from './components/TradingSignalCard';
import { SignalsHistoryTable } from './components/SignalsHistoryTable';
import { ToonViewer } from './components/ToonViewer';
import { TechnicalIndicatorsKPI } from './components/TechnicalIndicatorsKPI';
import { Card, Title, Text, Button } from '@tremor/react';
import type { TradingSignal } from './types/database';
import { getLatestSignal, getSignalHistory } from './services/signals';
import { getLatestIndicators, type IndicatorData } from './services/indicators';
import { SPACING, COLORS, COMPONENTS, LAYOUT } from './lib/styles';

function App() {
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [signalHistory, setSignalHistory] = useState<TradingSignal[]>([]);
  const [indicators, setIndicators] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignal = async () => {
    setLoading(true);
    setError(null);
    try {
      const [latestSignal, history, indicatorsData] = await Promise.all([
        getLatestSignal('BTC', '4h'),
        getSignalHistory('BTC', '4h', 20),
        getLatestIndicators('4h')
      ]);
      setSignal(latestSignal);
      setSignalHistory(history);
      setIndicators(indicatorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching signal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignal();
  }, []);

  if (loading) {
    return (
      <AppLayout
        title="Aurum - AI Trading Signals"
        subtitle="BTC Trading Signal Generator (Every 4 Hours)"
      >
        <Card>
          <Title>Loading...</Title>
          <Text className={SPACING.mt.sm}>Fetching latest trading signal from database...</Text>
        </Card>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout
        title="Aurum - AI Trading Signals"
        subtitle="BTC Trading Signal Generator (Every 4 Hours)"
      >
        <Card>
          <Title>Error</Title>
          <Text className={`${SPACING.mt.sm} ${COLORS.error}`}>{error}</Text>
          <Button onClick={fetchSignal} className={SPACING.mt.md}>
            Retry
          </Button>
        </Card>
      </AppLayout>
    );
  }

  if (!signal) {
    return (
      <AppLayout
        title="Aurum - AI Trading Signals"
        subtitle="BTC Trading Signal Generator (Every 4 Hours)"
      >
        <Card>
          <Title>No Trading Signals Available</Title>
          <Text className={SPACING.mt.sm}>
            No signals have been generated yet. The database is empty.
          </Text>
          <Text className={SPACING.mt.md}>
            <strong>To generate a signal manually, run:</strong>
          </Text>
          <div className={`${SPACING.mt.sm} ${COMPONENTS.codeBlock}`}>
            <Text>
              curl -X POST http://localhost:3000/api/analyze-signals \<br />
              &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
              &nbsp;&nbsp;-d '&#123;"symbol": "BTC", "interval": "4h", "limit": 100&#125;'
            </Text>
          </div>
          <Text className={SPACING.mt.md}>
            Or wait for the cron job to run automatically every 4 hours at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
          </Text>
          <Button onClick={fetchSignal} className={SPACING.mt.md}>
            Refresh
          </Button>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Aurum - AI Trading Signals"
      subtitle="BTC Trading Signal Generator (Every 4 Hours)"
    >
      <div className={SPACING.section}>
        {/* Latest Signal Section */}
        <div className={LAYOUT.contentContainer}>
          <TradingSignalCard signal={signal} />

          {signal.toon_data && signal.indicators_data && (
            <ToonViewer
              toonData={signal.toon_data}
              jsonData={signal.indicators_data}
            />
          )}
        </div>

        {/* Technical Indicators Section */}
        {indicators && (
          <div className={LAYOUT.container}>
            <Card>
              <div className={SPACING.mb.lg}>
                <Title>Technical Indicators</Title>
                <Text className={SPACING.mt.xs}>
                  All technical indicators used for signal generation
                </Text>
              </div>
              <TechnicalIndicatorsKPI
                indicators={indicators}
                currentPrice={signal.current_price}
              />
            </Card>
          </div>
        )}

        {/* Signal History Section */}
        {signalHistory.length > 0 && (
          <div className={LAYOUT.container}>
            <Card>
              <div className={SPACING.mb.md}>
                <Title>Signal History</Title>
                <Text className={SPACING.mt.xs}>
                  Last {signalHistory.length} trading signals for BTC 4h
                </Text>
              </div>
              <SignalsHistoryTable signals={signalHistory} />
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default App;
