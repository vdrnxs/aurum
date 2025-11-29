import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { fetchCandles } from './lib/hyperliquid.js';
import { prepareAIPayload } from './lib/toon.js';
import { analyzeTradingSignal } from './lib/openai.js';
import { SUPPORTED_INTERVALS, API_LIMITS } from './lib/constants.js';
import { createLogger } from './lib/logger.js';

const log = createLogger('analyze-signals');

/**
 * API Endpoint: /api/analyze-signals
 *
 * Generates AI-powered BTC trading signals every 4 hours
 *
 * Flow:
 * 1. Fetch 100 candles from Hyperliquid
 * 2. Save/update candles in Supabase (upsert)
 * 3. Calculate technical indicators
 * 4. Convert to TOON format
 * 5. Send to GPT-4o-mini for analysis
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

type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authentication: Verify cron secret to prevent unauthorized access
  const CRON_SECRET = process.env.CRON_SECRET;
  const providedSecret = req.headers['x-cron-secret'];

  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    log.warn('Unauthorized access attempt detected');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const startTime = Date.now();

  try {
    // Validate and parse request with Zod (runtime type safety)
    const parseResult = AnalyzeRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      log.warn('Invalid request parameters', { errors });
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: errors
      });
    }

    const { symbol, interval, limit } = parseResult.data;

    log.info('Starting analysis', { symbol, interval, limit });

    // Step 1: Fetch candles from Hyperliquid
    log.info('Step 1: Fetching candles from Hyperliquid');
    const candles = await fetchCandles(symbol, interval, limit);

    if (candles.length === 0) {
      log.error('No candles received from Hyperliquid');
      return res.status(500).json({ error: 'No candles received from Hyperliquid' });
    }

    log.info('Fetched candles from Hyperliquid', { count: candles.length });

    // Step 2: Save candles to Supabase
    log.info('Step 2: Saving candles to Supabase');
    const supabase = getSupabaseClient();

    // Prepare candles for upsert (remove id and created_at)
    const candlesForInsert = candles.map(c => ({
      symbol: c.symbol,
      interval: c.interval,
      open_time: c.open_time,
      close_time: c.close_time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      trades_count: c.trades_count,
    }));

    const { error: insertError } = await supabase
      .from('candles')
      .upsert(candlesForInsert, {
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

    // Step 4: Call GPT-4o-mini for analysis
    log.info('Step 4: Calling GPT-4o-mini for analysis');
    const aiSignal = await analyzeTradingSignal(toonData);
    log.info('AI signal generated', { signal: aiSignal.signal, confidence: aiSignal.confidence });

    // Step 5: Save trading signal to database
    log.info('Step 5: Saving trading signal to database');
    const latestCandle = candles[candles.length - 1];

    if (!latestCandle) {
      return res.status(500).json({ error: 'No candles available' });
    }

    const { data: signalData, error: signalError } = await supabase
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
      return res.status(500).json({ error: `Failed to save signal: ${signalError.message}` });
    }

    // Step 6: Save technical indicators to database
    log.info('Step 6: Saving technical indicators to database');

    if (!signalData) {
      log.error('Signal was saved but no data returned');
      return res.status(500).json({ error: 'Signal was saved but no data returned' });
    }

    const { error: indicatorsError } = await supabase
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
      const { error: deleteError } = await supabase
        .from('btc_trading_signals')
        .delete()
        .eq('id', signalData.id);

      if (deleteError) {
        log.error('CRITICAL: Failed to rollback signal', deleteError, { signalId: signalData.id });
        // Signal is now orphaned in database - manual cleanup may be required
        return res.status(500).json({
          error: `Failed to save indicators AND failed to rollback signal (ID: ${signalData.id}). Manual cleanup required.`
        });
      }

      return res.status(500).json({
        error: `Failed to save indicators: ${indicatorsError.message}. Signal was rolled back.`
      });
    }

    log.info('Technical indicators saved successfully');

    const processingTime = Date.now() - startTime;

    log.info('Analysis completed successfully', { processingTime });

    // Return success response
    return res.status(200).json({
      success: true,
      signal: {
        symbol,
        interval,
        signal: aiSignal.signal,
        confidence: aiSignal.confidence,
        entry_price: aiSignal.entry_price,
        stop_loss: aiSignal.stop_loss,
        take_profit: aiSignal.take_profit,
        reasoning: aiSignal.reasoning,
        candles_timestamp: latestCandle.open_time,
      },
      metadata: {
        candles_analyzed: candles.length,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    log.error('Unhandled error during analysis', error);

    const processingTime = Date.now() - startTime;

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: processingTime,
    });
  }
}