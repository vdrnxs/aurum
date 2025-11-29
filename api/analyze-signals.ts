import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { fetchCandles } from './lib/hyperliquid.js';
import { prepareAIPayload } from './lib/toon.js';
import { analyzeTradingSignal } from './lib/openai.js';

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

interface AnalyzeRequest {
  symbol?: string;
  interval?: string;
  limit?: number;
}

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

  const startTime = Date.now();

  try {
    // Parse request
    const {
      symbol = 'BTC',
      interval = '4h',
      limit = 100,
    }: AnalyzeRequest = req.body;

    console.log(`[analyze-signals] Starting analysis for ${symbol} ${interval}`);

    // Validate inputs
    if (symbol !== 'BTC') {
      return res.status(400).json({ error: 'Only BTC is supported currently' });
    }

    const validIntervals = ['1m', '5m', '15m', '1h', '4h', '1d'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({ error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}` });
    }

    if (limit < 50 || limit > 500) {
      return res.status(400).json({ error: 'Limit must be between 50 and 500' });
    }

    // Step 1: Fetch candles from Hyperliquid
    console.log('[analyze-signals] Step 1: Fetching candles from Hyperliquid...');
    const candles = await fetchCandles(symbol, interval, limit);

    if (candles.length === 0) {
      return res.status(500).json({ error: 'No candles received from Hyperliquid' });
    }

    console.log(`[analyze-signals] Fetched ${candles.length} candles`);

    // Step 2: Save candles to Supabase
    console.log('[analyze-signals] Step 2: Saving candles to Supabase...');
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
      console.error('[analyze-signals] Error saving candles:', insertError);
      // Continue anyway - we still have candles in memory
    } else {
      console.log(`[analyze-signals] Saved ${candles.length} candles to Supabase`);
    }

    // Step 3: Prepare AI payload with TOON format (send all 100 candles for full context)
    console.log('[analyze-signals] Step 3: Preparing TOON payload...');
    const { toonData, indicators } = prepareAIPayload(candles, symbol, interval, 100);
    console.log(`[analyze-signals] TOON data length: ${toonData.length} characters, candles sent: 100`);

    // Step 4: Call GPT-4o-mini for analysis
    console.log('[analyze-signals] Step 4: Calling GPT-4o-mini...');
    const aiSignal = await analyzeTradingSignal(toonData);
    console.log('[analyze-signals] AI Signal:', aiSignal);

    // Step 5: Save trading signal to database
    console.log('[analyze-signals] Step 5: Saving trading signal...');
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
      console.error('[analyze-signals] Error saving signal:', signalError);
      return res.status(500).json({ error: `Failed to save signal: ${signalError.message}` });
    }

    // Step 6: Save technical indicators to database
    console.log('[analyze-signals] Step 6: Saving technical indicators...');

    if (!signalData) {
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
      console.error('[analyze-signals] CRITICAL: Error saving indicators:', indicatorsError);

      // Rollback: Delete the signal we just created (orphan without indicators)
      console.log('[analyze-signals] Rolling back signal due to indicators error...');
      await supabase
        .from('btc_trading_signals')
        .delete()
        .eq('id', signalData.id);

      return res.status(500).json({
        error: `Failed to save indicators: ${indicatorsError.message}. Signal was rolled back.`
      });
    }

    console.log('[analyze-signals] Technical indicators saved successfully');

    const processingTime = Date.now() - startTime;

    console.log(`[analyze-signals] Success! Processed in ${processingTime}ms`);

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
    console.error('[analyze-signals] Error:', error);

    const processingTime = Date.now() - startTime;

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: processingTime,
    });
  }
}