import { NextRequest, NextResponse } from 'next/server';
import { fetchCandles } from '@/lib/api/hyperliquid';
import { prepareAIPayload } from '@/lib/api/toon';
import { getLatestValues } from '@/lib/api/indicators';
import { createLogger } from '@/lib/api/logger';

const log = createLogger('test-pipeline');

/**
 * Test endpoint to verify the entire pipeline works WITHOUT calling OpenAI
 *
 * Tests:
 * 1. ✅ Fetch candles from Hyperliquid
 * 2. ✅ Calculate technical indicators
 * 3. ✅ Generate TOON format
 * 4. ❌ Skip OpenAI (no API key needed)
 * 5. ✅ Return mock signal
 */
export async function GET(_request: NextRequest) {
  const startTime = Date.now();

  try {
    log.info('Starting test pipeline');

    // Step 1: Fetch candles from Hyperliquid
    log.info('Step 1: Fetching candles from Hyperliquid');
    const candles = await fetchCandles('BTC', '4h', 100);

    if (candles.length === 0) {
      log.error('No candles received from Hyperliquid');
      return NextResponse.json({ error: 'No candles received from Hyperliquid' }, { status: 500 });
    }

    log.info('✅ Fetched candles from Hyperliquid', { count: candles.length });

    // Step 2: Calculate indicators
    log.info('Step 2: Calculating technical indicators');
    const indicators = getLatestValues(candles);
    log.info('✅ Calculated technical indicators');

    // Step 3: Prepare TOON payload
    log.info('Step 3: Preparing TOON payload');
    const { toonData } = prepareAIPayload(candles, 'BTC', '4h', 20);
    log.info('✅ TOON payload prepared', { length: toonData.length });

    // Step 4: Mock AI signal (skip OpenAI)
    log.info('Step 4: Generating MOCK signal (OpenAI skipped)');
    const mockSignal = {
      signal: 'HOLD' as const,
      confidence: 50,
      entry_price: indicators.price,
      stop_loss: indicators.price - (indicators.atr * 1.5),
      take_profit: indicators.price + (indicators.atr * 3.5),
      reasoning: '[MOCK] This is a test signal. OpenAI was not called.',
    };
    log.info('✅ Mock signal generated');

    const processingTime = Date.now() - startTime;

    log.info('Test pipeline completed successfully', { processingTime });

    // Return detailed test results
    return NextResponse.json({
      success: true,
      message: '✅ All pipeline steps work correctly (OpenAI skipped)',
      test_results: {
        step1_hyperliquid: {
          status: 'SUCCESS',
          candles_fetched: candles.length,
          latest_candle: {
            timestamp: candles[candles.length - 1].open_time,
            price: candles[candles.length - 1].close,
          },
        },
        step2_indicators: {
          status: 'SUCCESS',
          sample: {
            price: indicators.price,
            rsi14: indicators.rsi.rsi14,
            sma21: indicators.sma.sma21,
            atr: indicators.atr,
          },
        },
        step3_toon: {
          status: 'SUCCESS',
          toon_length: toonData.length,
          compression_ratio: `${((toonData.length / JSON.stringify(candles).length) * 100).toFixed(1)}%`,
        },
        step4_ai: {
          status: 'SKIPPED',
          reason: 'OpenAI API key disabled (test mode)',
          mock_signal: mockSignal,
        },
      },
      metadata: {
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    log.error('Test pipeline failed', error);

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: processingTime,
      },
      { status: 500 }
    );
  }
}