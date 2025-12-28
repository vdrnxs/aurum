import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const mockSignals = [
  // Latest signal - STRONG_BUY
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now(),
    signal: 'STRONG_BUY',
    confidence: 85.5,
    current_price: 95234.50,
    entry_price: 95234.50,
    stop_loss: 94200.00,
    take_profit: 97800.00,
    ai_reasoning: 'Strong bullish momentum detected. RSI showing oversold conditions with a recent bounce. MACD crossover indicates potential uptrend. Volume increasing on green candles. Price broke above key resistance at $94,800.',
  },
  // Previous signals
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
    signal: 'BUY',
    confidence: 72.3,
    current_price: 94850.00,
    entry_price: 94850.00,
    stop_loss: 93900.00,
    take_profit: 96500.00,
    ai_reasoning: 'Moderate bullish signals. EMA crossover suggests upward momentum. Support holding at $94,000 level.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 8 * 60 * 60 * 1000, // 8 hours ago
    signal: 'HOLD',
    confidence: 45.0,
    current_price: 94200.00,
    entry_price: 94200.00,
    stop_loss: null,
    take_profit: null,
    ai_reasoning: 'Consolidation phase detected. No clear trend direction. Waiting for breakout confirmation.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
    signal: 'SELL',
    confidence: 68.7,
    current_price: 93500.00,
    entry_price: 93500.00,
    stop_loss: 94200.00,
    take_profit: 92100.00,
    ai_reasoning: 'Bearish divergence on RSI. Price rejected at resistance. Volume declining on upward moves.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 16 * 60 * 60 * 1000, // 16 hours ago
    signal: 'BUY',
    confidence: 76.2,
    current_price: 92800.00,
    entry_price: 92800.00,
    stop_loss: 91900.00,
    take_profit: 94500.00,
    ai_reasoning: 'Bounce from key support level. Bullish engulfing pattern on 4h chart. Increasing buying pressure.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 20 * 60 * 60 * 1000,
    signal: 'STRONG_SELL',
    confidence: 82.1,
    current_price: 91500.00,
    entry_price: 91500.00,
    stop_loss: 92300.00,
    take_profit: 89800.00,
    ai_reasoning: 'Strong bearish momentum. Breaking below major support levels. High volume on red candles.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 24 * 60 * 60 * 1000,
    signal: 'SELL',
    confidence: 71.5,
    current_price: 93200.00,
    entry_price: 93200.00,
    stop_loss: 94000.00,
    take_profit: 91500.00,
    ai_reasoning: 'Downtrend continuation. Lower highs and lower lows pattern. Resistance holding at $94k.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 28 * 60 * 60 * 1000,
    signal: 'BUY',
    confidence: 79.3,
    current_price: 94600.00,
    entry_price: 94600.00,
    stop_loss: 93700.00,
    take_profit: 96200.00,
    ai_reasoning: 'Golden cross on moving averages. Strong support at $94k. Bullish momentum building.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 32 * 60 * 60 * 1000,
    signal: 'HOLD',
    confidence: 52.0,
    current_price: 94100.00,
    entry_price: 94100.00,
    stop_loss: null,
    take_profit: null,
    ai_reasoning: 'Range-bound trading. No clear directional bias. Mixed signals from technical indicators.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 36 * 60 * 60 * 1000,
    signal: 'STRONG_BUY',
    confidence: 88.9,
    current_price: 93800.00,
    entry_price: 93800.00,
    stop_loss: 92800.00,
    take_profit: 96500.00,
    ai_reasoning: 'Breakout from consolidation pattern. Extremely high volume. All major indicators bullish.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 40 * 60 * 60 * 1000,
    signal: 'BUY',
    confidence: 74.8,
    current_price: 92500.00,
    entry_price: 92500.00,
    stop_loss: 91600.00,
    take_profit: 94200.00,
    ai_reasoning: 'Support test successful. Bullish reversal pattern forming. Positive divergence on RSI.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 44 * 60 * 60 * 1000,
    signal: 'SELL',
    confidence: 69.4,
    current_price: 93900.00,
    entry_price: 93900.00,
    stop_loss: 94700.00,
    take_profit: 92300.00,
    ai_reasoning: 'Overbought conditions. Resistance rejection at $94.5k. Bearish candle pattern.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 48 * 60 * 60 * 1000,
    signal: 'BUY',
    confidence: 77.6,
    current_price: 95100.00,
    entry_price: 95100.00,
    stop_loss: 94200.00,
    take_profit: 96800.00,
    ai_reasoning: 'Strong uptrend intact. Higher highs and higher lows. Bullish momentum continues.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 52 * 60 * 60 * 1000,
    signal: 'STRONG_BUY',
    confidence: 86.3,
    current_price: 94300.00,
    entry_price: 94300.00,
    stop_loss: 93300.00,
    take_profit: 97000.00,
    ai_reasoning: 'Major breakout confirmed. Institutional buying detected. All timeframes bullish.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 56 * 60 * 60 * 1000,
    signal: 'HOLD',
    confidence: 48.5,
    current_price: 93600.00,
    entry_price: 93600.00,
    stop_loss: null,
    take_profit: null,
    ai_reasoning: 'Sideways movement. Awaiting breakout direction. Low volatility environment.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 60 * 60 * 60 * 1000,
    signal: 'BUY',
    confidence: 73.1,
    current_price: 92900.00,
    entry_price: 92900.00,
    stop_loss: 92000.00,
    take_profit: 94600.00,
    ai_reasoning: 'Pullback to support completed. Bullish bounce expected. Good risk/reward setup.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 64 * 60 * 60 * 1000,
    signal: 'SELL',
    confidence: 70.2,
    current_price: 94800.00,
    entry_price: 94800.00,
    stop_loss: 95600.00,
    take_profit: 93100.00,
    ai_reasoning: 'Distribution phase detected. Smart money selling. Bearish divergence forming.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 68 * 60 * 60 * 1000,
    signal: 'BUY',
    confidence: 75.9,
    current_price: 93400.00,
    entry_price: 93400.00,
    stop_loss: 92500.00,
    take_profit: 95100.00,
    ai_reasoning: 'Accumulation zone identified. Bullish reversal signals. Strong support level.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 72 * 60 * 60 * 1000,
    signal: 'STRONG_SELL',
    confidence: 83.7,
    current_price: 92200.00,
    entry_price: 92200.00,
    stop_loss: 93000.00,
    take_profit: 89900.00,
    ai_reasoning: 'Major support break. Panic selling detected. Bearish trend acceleration.',
    
    
  },
  {
    symbol: 'BTC',
    interval: '4h',
    candles_timestamp: Date.now() - 76 * 60 * 60 * 1000,
    signal: 'BUY',
    confidence: 78.4,
    current_price: 94700.00,
    entry_price: 94700.00,
    stop_loss: 93800.00,
    take_profit: 96400.00,
    ai_reasoning: 'Recovery rally initiated. Oversold bounce in progress. Bullish momentum returning.',
    
    
  },
]

async function seedMockData() {
  console.log('🌱 Seeding mock trading signals...')

  // Delete existing signals for BTC 4h
  console.log('🗑️  Clearing existing signals...')
  const { error: deleteError } = await supabase
    .from('btc_trading_signals')
    .delete()
    .eq('symbol', 'BTC')
    .eq('interval', '4h')

  if (deleteError) {
    console.error('❌ Error deleting existing signals:', deleteError)
    process.exit(1)
  }

  // Insert mock signals
  console.log('📊 Inserting mock signals...')
  const { data, error } = await supabase
    .from('btc_trading_signals')
    .insert(mockSignals)
    .select()

  if (error) {
    console.error('❌ Error inserting mock signals:', error)
    process.exit(1)
  }

  console.log(`✅ Successfully inserted ${data.length} mock signals`)
  console.log('🎉 Seed complete!')

  // Print summary
  const buyCount = mockSignals.filter(s => s.signal === 'BUY' || s.signal === 'STRONG_BUY').length
  const sellCount = mockSignals.filter(s => s.signal === 'SELL' || s.signal === 'STRONG_SELL').length
  const holdCount = mockSignals.filter(s => s.signal === 'HOLD').length

  console.log('\n📈 Summary:')
  console.log(`   BUY signals: ${buyCount}`)
  console.log(`   SELL signals: ${sellCount}`)
  console.log(`   HOLD signals: ${holdCount}`)
  console.log(`   Total: ${mockSignals.length}`)
}

seedMockData()
