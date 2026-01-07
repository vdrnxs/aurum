import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { fetchCandles } from '@/lib/api/hyperliquid';
import { prepareAIPayload } from '@/lib/api/toon';
import { analyzeTradingSignal } from '@/lib/api/ai';
import { SUPPORTED_INTERVALS, API_LIMITS } from '@/lib/api/constants';
import { createLogger } from '@/lib/api/logger';
import { executeAutoTrade } from '@/lib/api/auto-trader';

const log = createLogger('analyze-signals');

// Singleton: Read CRON_SECRET once at module load time
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * API Endpoint: POST /api/analyze-signals
 *
 * Generates AI-powered BTC trading signals every 4 hours
 *
 * Flow:
 * 1. Fetch 100 candles from Hyperliquid
 * 2. Save/update candles in Supabase (upsert)
 * 3. Calculate technical indicators
 * 4. Convert to TOON format
 * 5. Send to Cerebras z.ai-glm-4.6 for analysis
 * 6. Parse AI response (signal, SL, TP)
 * 7. Save to btc_trading_signals table
 */

// Zod schema for runtime validation of API request
const AnalyzeRequestSchema = z.object({
  symbol: z.enum(['BTC']).default('BTC'),
  interval: z.enum(SUPPORTED_INTERVALS).default('4h'),
  limit: z.number()
    .int('Limit must be an integer')
    .min(API_LIMITS.MIN_CANDLES, `Limit must be at least ${API_LIMITS.MIN_CANDLES}`)
    .max(API_LIMITS.MAX_CANDLES, `Limit must be at most ${API_LIMITS.MAX_CANDLES}`)
    .default(API_LIMITS.DEFAULT_CANDLES),
}).strict();

export async function POST(request: NextRequest) {
  // Authentication: Verify cron secret to prevent unauthorized access
  const providedSecret = request.headers.get('x-cron-secret');

  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    log.warn('Unauthorized access attempt detected');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();

    // Validate and parse request with Zod (runtime type safety)
    const parseResult = AnalyzeRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      log.warn('Invalid request parameters', { errors });
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: errors
        },
        { status: 400 }
      );
    }

    const { symbol, interval, limit } = parseResult.data;

    log.info('Starting analysis', { symbol, interval, limit });

    // Step 1: Fetch candles from Hyperliquid
    log.info('Step 1: Fetching candles from Hyperliquid');
    const candles = await fetchCandles(symbol, interval, limit);

    if (candles.length === 0) {
      log.error('No candles received from Hyperliquid');
      return NextResponse.json({ error: 'No candles received from Hyperliquid' }, { status: 500 });
    }

    log.info('Fetched candles from Hyperliquid', { count: candles.length });

    // Step 2: Save candles to Supabase (DRY: candles already in correct format)
    log.info('Step 2: Saving candles to Supabase');

    const { error: insertError } = await supabaseServer
      .from('candles')
      .upsert(candles, {
        onConflict: 'symbol,interval,open_time',
      });

    if (insertError) {
      log.error('Error saving candles to Supabase', insertError);
      // Continue anyway - we still have candles in memory
    } else {
      log.info('Saved candles to Supabase', { count: candles.length });
    }

    // Step 3: Prepare AI payload with TOON format (send all 100 candles for full context)
    log.info('Step 3: Preparing TOON payload');
    const { toonData, indicators } = prepareAIPayload(candles, symbol, interval, 100);
    log.debug('TOON payload prepared', { length: toonData.length, candlesSent: 100 });

    // Step 4: Call Cerebras AI for analysis
    log.info('Step 4: Calling Cerebras z.ai-glm-4.6 for analysis');
    const aiSignal = await analyzeTradingSignal(toonData);
    log.info('AI signal generated', { signal: aiSignal.signal, confidence: aiSignal.confidence });

    // Step 5: Save trading signal to database
    log.info('Step 5: Saving trading signal to database');
    const latestCandle = candles[candles.length - 1]; // Already validated candles.length > 0 at line 83

    const { data: signalData, error: signalError } = await supabaseServer
      .from('btc_trading_signals')
      .insert({
        symbol,
        interval,
        candles_timestamp: latestCandle.open_time,
        signal: aiSignal.signal,
        confidence: aiSignal.confidence,
        current_price: latestCandle.close,
        entry_price: aiSignal.entry_price,
        stop_loss: aiSignal.stop_loss,
        take_profit: aiSignal.take_profit,
        ai_reasoning: aiSignal.reasoning,
      })
      .select('id')
      .single();

    if (signalError) {
      log.error('Error saving signal to database', signalError);
      return NextResponse.json({ error: `Failed to save signal: ${signalError.message}` }, { status: 500 });
    }

    // Step 6: Save technical indicators to database
    log.info('Step 6: Saving technical indicators to database');

    if (!signalData) {
      log.error('Signal was saved but no data returned');
      return NextResponse.json({ error: 'Signal was saved but no data returned' }, { status: 500 });
    }

    const { error: indicatorsError } = await supabaseServer
      .from('btc_indicators')
      .insert({
        signal_id: signalData.id,
        price: indicators.price,
        sma_21: indicators.sma.sma21,
        sma_50: indicators.sma.sma50,
        sma_100: indicators.sma.sma100,
        ema_12: indicators.ema.ema12,
        ema_21: indicators.ema.ema21,
        ema_55: indicators.ema.ema55,
        rsi_14: indicators.rsi.rsi14,
        rsi_21: indicators.rsi.rsi21,
        macd_line: indicators.macd.line,
        macd_signal: indicators.macd.signal,
        macd_histogram: indicators.macd.histogram,
        bb_upper: indicators.bollingerBands.upper,
        bb_middle: indicators.bollingerBands.middle,
        bb_lower: indicators.bollingerBands.lower,
        atr: indicators.atr,
        psar_value: indicators.psar.value,
        psar_trend: indicators.psar.trend,
        stoch_k: indicators.stochastic.k,
        stoch_d: indicators.stochastic.d,
      });

    if (indicatorsError) {
      log.error('CRITICAL: Error saving indicators', indicatorsError, { signalId: signalData.id });

      // Rollback: Delete the signal we just created (orphan without indicators)
      log.warn('Rolling back signal due to indicators error', { signalId: signalData.id });
      const { error: deleteError } = await supabaseServer
        .from('btc_trading_signals')
        .delete()
        .eq('id', signalData.id);

      if (deleteError) {
        log.error('CRITICAL: Failed to rollback signal', deleteError, { signalId: signalData.id });
        // Signal is now orphaned in database - manual cleanup may be required
        return NextResponse.json(
          {
            error: `Failed to save indicators AND failed to rollback signal (ID: ${signalData.id}). Manual cleanup required.`
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: `Failed to save indicators: ${indicatorsError.message}. Signal was rolled back.`
        },
        { status: 500 }
      );
    }

    log.info('Technical indicators saved successfully');

    // Step 7: Execute trade automatically if enabled and signal meets criteria
    log.info('Step 7: Evaluating auto-trade conditions');
    const tradeResult = await executeAutoTrade({ symbol, aiSignal });

    const processingTime = Date.now() - startTime;

    log.info('Analysis completed successfully', { processingTime });

    // Return success response
    // Note: Prices are rounded for BTC (whole numbers required for trading)
    return NextResponse.json({
      success: true,
      signal: {
        symbol,
        interval,
        signal: aiSignal.signal,
        confidence: aiSignal.confidence,
        entry_price: Math.round(aiSignal.entry_price),
        stop_loss: Math.round(aiSignal.stop_loss),
        take_profit: Math.round(aiSignal.take_profit),
        reasoning: aiSignal.reasoning,
        candles_timestamp: latestCandle.open_time,
      },
      trade: tradeResult,
      metadata: {
        candles_analyzed: candles.length,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    log.error('Unhandled error during analysis', error);

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: processingTime,
      },
      { status: 500 }
    );
  }
}