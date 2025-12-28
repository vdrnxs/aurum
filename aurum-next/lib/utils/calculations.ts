import type { SignalType } from '@/types/database'

const MIN_RISK_USD = 1
const MAX_RR_RATIO = 100

/**
 * Calculates the Risk/Reward ratio for a trading signal
 * @returns Risk/Reward ratio (e.g., 2.5 means 1:2.5) or null if invalid
 */
export function calculateRiskReward(
  entryPrice: number | null,
  stopLoss: number | null,
  takeProfit: number | null,
  signal: SignalType
): number | null {
  if (!entryPrice || !stopLoss || !takeProfit || signal === 'HOLD') {
    return null
  }

  const isBuy = signal === 'BUY' || signal === 'STRONG_BUY'

  if (isBuy) {
    const risk = Math.abs(entryPrice - stopLoss)
    const reward = Math.abs(takeProfit - entryPrice)

    if (risk < MIN_RISK_USD) return null

    const ratio = reward / risk
    return ratio > MAX_RR_RATIO ? null : ratio
  } else {
    const risk = Math.abs(stopLoss - entryPrice)
    const reward = Math.abs(entryPrice - takeProfit)

    if (risk < MIN_RISK_USD) return null

    const ratio = reward / risk
    return ratio > MAX_RR_RATIO ? null : ratio
  }
}

/**
 * Calculates percentage change between two prices
 */
export function calculatePercentageChange(
  fromPrice: number,
  toPrice: number
): number {
  return ((toPrice - fromPrice) / fromPrice) * 100
}
