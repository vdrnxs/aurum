import { encode, decode } from '@toon-format/toon';
import { encode as encodeTokens } from 'gpt-tokenizer';
import { IndicatorService } from './indicators';
import type { Candle } from '../types/database';

/**
 * TOON Service
 * Converts financial indicators to TOON format for AI processing
 * Reduces token count by ~40% compared to JSON
 */
export class ToonService {
  /**
   * Encodes all calculated indicators to TOON format
   * Use this for comprehensive AI analysis with full historical data
   *
   * @param candles - Array of candle data
   * @returns TOON-encoded string with all indicators
   *
   * @example
   * ```ts
   * const candles = await CandleService.getCandles('BTC', '1h', 100);
   * const toonData = ToonService.encodeIndicators(candles);
   * // Send to AI API
   * ```
   */
  static encodeIndicators(candles: Candle[]): string {
    const indicators = IndicatorService.calculateAll(candles);
    return encode(indicators);
  }

  /**
   * Encodes only the latest indicator values to TOON format
   * Use this for real-time AI decisions with minimal token usage
   *
   * @param candles - Array of candle data
   * @returns TOON-encoded string with current snapshot
   *
   * @example
   * ```ts
   * const candles = await CandleService.getCandles('BTC', '1h', 100);
   * const snapshot = ToonService.encodeLatestSnapshot(candles);
   * // Minimal payload for quick AI queries
   * ```
   */
  static encodeLatestSnapshot(candles: Candle[]): string {
    const latest = IndicatorService.getLatestValues(candles);
    return encode(latest);
  }

  /**
   * Prepares optimized AI payload with context metadata
   * Includes symbol, interval, and both current + recent historical data
   *
   * @param candles - Array of candle data
   * @param symbol - Trading symbol (e.g., 'BTC', 'ETH')
   * @param interval - Candle interval (e.g., '1h', '4h', '1d')
   * @param historyLimit - Number of recent candles to include (default: 20)
   * @returns TOON-encoded string with complete AI context
   *
   * @example
   * ```ts
   * const payload = ToonService.prepareAIPayload(candles, 'BTC', '1h', 20);
   * await fetch('/api/ai-analysis', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'text/plain' },
   *   body: payload
   * });
   * ```
   */
  static prepareAIPayload(
    candles: Candle[],
    symbol: string,
    interval: string,
    historyLimit: number = 20
  ): string {
    const payload = this.buildAIPayloadObject(candles, symbol, interval, historyLimit);
    return encode(payload);
  }

  /**
   * Builds the AI payload object (without encoding)
   * Used internally by prepareAIPayload and for comparisons
   */
  static buildAIPayloadObject(
    candles: Candle[],
    symbol: string,
    interval: string,
    historyLimit: number = 20
  ) {
    const latest = IndicatorService.getLatestValues(candles);
    const recentCandles = candles.slice(-historyLimit);

    return {
      metadata: {
        symbol,
        interval,
        timestamp: Date.now(),
        candleCount: candles.length,
        historyDepth: historyLimit,
      },
      current: latest,
      recentHistory: {
        prices: recentCandles.map((c) => ({
          timestamp: c.open_time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        })),
        sma: IndicatorService.calculateSMA(candles, 20).slice(-historyLimit),
        rsi: IndicatorService.calculateRSI(candles, 14).slice(-historyLimit),
      },
    };
  }

  /**
   * Decodes TOON string back to JSON object
   * Use this if you need to parse TOON responses from AI
   *
   * @param toonString - TOON-encoded string
   * @returns Decoded JavaScript object
   */
  static decode<T = unknown>(toonString: string): T {
    return decode(toonString) as T;
  }

  /**
   * Compares token count between JSON and TOON encodings
   * Uses GPT tokenizer (cl100k_base) for accurate token counting
   * Utility for debugging and optimization analysis
   *
   * @param data - Any JSON-serializable data
   * @returns Token comparison statistics
   */
  static compareTokens(data: unknown): {
    jsonTokens: number;
    toonTokens: number;
    reduction: number;
    reductionPercent: string;
  } {
    const jsonString = JSON.stringify(data);
    const toonString = encode(data);

    // Use actual GPT tokenizer for accurate token counting (cl100k_base encoding used by GPT-4)
    const jsonTokens = encodeTokens(jsonString).length;
    const toonTokens = encodeTokens(toonString).length;
    const reduction = jsonTokens - toonTokens;
    const reductionPercent = ((reduction / jsonTokens) * 100).toFixed(1);

    return {
      jsonTokens,
      toonTokens,
      reduction,
      reductionPercent: `${reductionPercent}%`,
    };
  }

  /**
   * Exports indicators to TOON format file (for debugging/logging)
   *
   * @param candles - Array of candle data
   * @returns TOON string suitable for file export or logging
   */
  static exportForLogging(candles: Candle[]): string {
    const indicators = IndicatorService.calculateAll(candles);
    const latest = IndicatorService.getLatestValues(candles);

    return encode({
      summary: latest,
      fullData: indicators,
      generatedAt: new Date().toISOString(),
    });
  }
}