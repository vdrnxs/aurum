/**
 * Frontend-only constants
 * For backend constants, see lib/api/constants.ts
 */

// Trading Risk Management (used in UI components and calculations)
export const RISK_MANAGEMENT = {
  MIN_RISK_USD: 1, // Minimum risk in USD to consider valid
  MAX_RR_RATIO: 100, // Maximum R:R ratio before considering data invalid
  FAVORABLE_RR_THRESHOLD: 2, // Minimum R:R to be considered "favorable"
} as const;