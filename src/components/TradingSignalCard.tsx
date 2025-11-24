import {
  Card,
  Title,
  Text,
  Metric,
  Badge,
  Grid,
} from '@tremor/react';
import type { TradingSignal, SignalType } from '../types/database';
import { SPACING, COLORS, COMPONENTS } from '../lib/styles';

interface TradingSignalCardProps {
  signal: TradingSignal;
}

function getSignalColor(signal: SignalType): string {
  const colors: Record<SignalType, string> = {
    STRONG_BUY: 'emerald',
    BUY: 'green',
    HOLD: 'gray',
    SELL: 'orange',
    STRONG_SELL: 'red',
  };
  return colors[signal];
}


function formatPrice(price: number | null): string {
  if (price === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function calculateRiskReward(
  entryPrice: number | null,
  stopLoss: number | null,
  takeProfit: number | null,
  signal: SignalType
): number | null {
  if (!entryPrice || !stopLoss || !takeProfit) return null;

  // For HOLD signals, return null (no clear direction)
  if (signal === 'HOLD') return null;

  const isBuy = signal === 'BUY' || signal === 'STRONG_BUY';

  if (isBuy) {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    return risk > 0 ? reward / risk : null;
  } else {
    const risk = Math.abs(stopLoss - entryPrice);
    const reward = Math.abs(entryPrice - takeProfit);
    return risk > 0 ? reward / risk : null;
  }
}

export function TradingSignalCard({ signal }: TradingSignalCardProps) {
  const signalColor = getSignalColor(signal.signal);
  const riskReward = calculateRiskReward(
    signal.entry_price,
    signal.stop_loss,
    signal.take_profit,
    signal.signal
  );

  return (
    <Card>
      {/* Header: Inline Style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge color="slate" size="sm">
            {signal.symbol}
          </Badge>
          <Title className="text-2xl m-0">{signal.signal.replace('_', ' ')}</Title>
        </div>
        <div className="text-right">
          <Text className="text-xs text-tremor-content-subtle uppercase tracking-wide">Confidence</Text>
          <Text className="text-2xl font-semibold" style={{ color: `var(--${signalColor}-500)` }}>
            {signal.confidence.toFixed(0)}%
          </Text>
        </div>
      </div>

      {/* Entry Price - Hero Section */}
      <div className={`${SPACING.mt.lg} ${COMPONENTS.infoBox} text-center`}>
        <Text className="text-tremor-content-subtle text-sm uppercase tracking-wide">Entry Price</Text>
        <Metric className="text-5xl mt-2">{formatPrice(signal.entry_price)}</Metric>
      </div>

      {/* Risk Management Grid */}
      <Grid numItems={1} numItemsSm={3} className={`${SPACING.gap.md} ${SPACING.mt.lg}`}>
        <Card decoration="left" decorationColor="red">
          <Text className="text-xs text-tremor-content-subtle uppercase tracking-wide">Stop Loss</Text>
          <Metric className="mt-2">{formatPrice(signal.stop_loss)}</Metric>
          {signal.entry_price && signal.stop_loss && (
            <Text className={`${SPACING.mt.xs} text-xs ${COLORS.error}`}>
              -{(
                ((signal.entry_price - signal.stop_loss) / signal.entry_price) *
                100
              ).toFixed(2)}%
            </Text>
          )}
        </Card>

        <Card decoration="left" decorationColor="emerald">
          <Text className="text-xs text-tremor-content-subtle uppercase tracking-wide">Take Profit</Text>
          <Metric className="mt-2">{formatPrice(signal.take_profit)}</Metric>
          {signal.entry_price && signal.take_profit && (
            <Text className={`${SPACING.mt.xs} text-xs ${COLORS.success}`}>
              +{(
                ((signal.take_profit - signal.entry_price) / signal.entry_price) *
                100
              ).toFixed(2)}%
            </Text>
          )}
        </Card>

        <Card decoration="left" decorationColor="blue">
          <Text className="text-xs text-tremor-content-subtle uppercase tracking-wide">Risk/Reward</Text>
          <Metric className="mt-2">
            {riskReward ? `1:${riskReward.toFixed(2)}` : 'N/A'}
          </Metric>
          <Text className={`${SPACING.mt.xs} text-xs text-tremor-content-subtle`}>
            {riskReward && riskReward >= 2 ? 'Favorable' : riskReward ? 'Moderate' : ''}
          </Text>
        </Card>
      </Grid>

      {signal.ai_reasoning && (
        <div className={`${SPACING.mt.lg} ${COMPONENTS.infoBox}`}>
          <Text className={`font-semibold ${SPACING.mb.sm}`}>AI Analysis</Text>
          <Text className="text-tremor-content dark:text-dark-tremor-content">{signal.ai_reasoning}</Text>
        </div>
      )}

    </Card>
  );
}
