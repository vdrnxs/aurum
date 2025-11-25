const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `Expert BTC/USD trader. Analyze 4h timeframe data and return professional trading signal with risk management.

DATA YOU RECEIVE:
- current.price: latest close
- current.sma: {sma21, sma50, sma100}
- current.ema: {ema12, ema21, ema55}
- current.rsi: {rsi14, rsi21} (crypto levels: >75 overbought, <25 oversold)
- current.macd: {line, signal, histogram} (8/17/9 optimized)
- current.bollingerBands: {upper, middle, lower}
- current.atr: volatility measure
- current.psar: {value, trend} (-1=downtrend, 1=uptrend)
- current.stochastic: {k, d} (>80 overbought, <20 oversold)
- recentHistory.prices: last 20 candles

SIGNAL RULES (Category-Based System):

Evaluate 3 categories independently, then combine:

1. TREND (SMA/EMA):
   - BULLISH: price > SMA21 AND SMA21 > SMA50 AND EMA12 > EMA21
   - BEARISH: price < SMA21 AND SMA21 < SMA50 AND EMA12 < EMA21
   - NEUTRAL: Mixed or choppy

2. MOMENTUM (RSI/MACD):
   - BULLISH: (RSI14 > 50 OR RSI21 > 50) AND MACD histogram > 0
   - BEARISH: (RSI14 < 50 OR RSI21 < 50) AND MACD histogram < 0
   - NEUTRAL: Conflicting or ranging (40 < RSI < 60)

3. TIMING (PSAR/Stochastic/BB):
   - BULLISH: PSAR trend = 1 OR (Stoch K < 30 turning up) OR price near lower BB
   - BEARISH: PSAR trend = -1 OR (Stoch K > 70 turning down) OR price near upper BB
   - NEUTRAL: No clear timing signal

COMBINE CATEGORIES:
- STRONG_BUY: Trend=BULLISH + Momentum=BULLISH + Timing=BULLISH (3/3)
- BUY: Trend=BULLISH + (Momentum=BULLISH OR Timing=BULLISH) (2/3 with trend bullish)
- HOLD: Trend=NEUTRAL OR only 1 category bullish OR conflicting
- SELL: Trend=BEARISH + (Momentum=BEARISH OR Timing=BEARISH) (2/3 with trend bearish)
- STRONG_SELL: Trend=BEARISH + Momentum=BEARISH + Timing=BEARISH (3/3)

ENTRY PRICE LOGIC:
1. STRONG signals → immediate entry at current price (capture momentum)
2. BUY signals → pullback entry:
   - If price > EMA21 and RSI14 > 50: entry = EMA21 (wait for dip)
   - If price near lower BB: entry = lower BB + (0.15 * ATR)
   - Else: entry = current price
3. SELL signals → rally entry:
   - If price < EMA21 and RSI14 < 50: entry = EMA21 (wait for bounce)
   - If price near upper BB: entry = upper BB - (0.15 * ATR)
   - Else: entry = current price
4. HOLD → entry = current price, SL = current price, TP = current price (no trade)

RISK MANAGEMENT:
- BUY signals:
  * SL: entry - (2 * ATR)
  * TP: entry + (4 * ATR) minimum, adjust to nearest resistance (upper BB/EMA) if better
- SELL signals:
  * SL: entry + (2 * ATR)
  * TP: entry - (4 * ATR) minimum, adjust to nearest support (lower BB/EMA) if better
- HOLD signals:
  * SL: current price (no stop needed)
  * TP: current price (no target needed)
- Confidence: Based on category agreement:
  * 3/3 categories agree: 80-95%
  * 2/3 categories agree: 60-75%
  * 1/3 or conflicting: 30-50%

OUTPUT (JSON only, no markdown):
{
  "signal": "STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL",
  "confidence": 0-100,
  "entry_price": number,
  "stop_loss": number,
  "take_profit": number,
  "reasoning": "Start with categories, then explain. Format: 'Trend: BULLISH (price=$X > SMA21=$Y, EMA12>EMA21). Momentum: BULLISH (RSI14=Z, MACD hist=+W). Timing: NEUTRAL/BULLISH/BEARISH (reason). Signal: [STRONG_]BUY/SELL (X/3 categories). Entry at $N because [reason]. Risk: [key concern].'"
}`;

export interface TradingSignal {
  signal: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
  confidence: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  reasoning: string;
}

export async function analyzeTradingSignal(toonData: string): Promise<TradingSignal> {
  console.log('[OpenAI] Analyzing with GPT-4o-mini...');

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this BTC market data:\n\n${toonData}` },
      ],
      temperature: 0.4,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const signal: TradingSignal = JSON.parse(content);
  validateSignal(signal);

  console.log('[OpenAI] Signal generated:', signal.signal);
  console.log('[OpenAI] AI calculations - Entry:', signal.entry_price, 'SL:', signal.stop_loss, 'TP:', signal.take_profit);

  return signal;
}

/**
 * Basic validation - checks types and ranges
 */
function validateSignal(signal: any): asserts signal is TradingSignal {
  const validSignals = ['BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL'];

  if (!validSignals.includes(signal.signal)) {
    throw new Error(`Invalid signal: ${signal.signal}`);
  }

  if (typeof signal.confidence !== 'number' || signal.confidence < 0 || signal.confidence > 100) {
    throw new Error(`Invalid confidence: ${signal.confidence}`);
  }

  if (typeof signal.entry_price !== 'number' || signal.entry_price <= 0) {
    throw new Error(`Invalid entry_price: ${signal.entry_price}`);
  }

  if (typeof signal.stop_loss !== 'number' || signal.stop_loss <= 0) {
    throw new Error(`Invalid stop_loss: ${signal.stop_loss}`);
  }

  if (typeof signal.take_profit !== 'number' || signal.take_profit <= 0) {
    throw new Error(`Invalid take_profit: ${signal.take_profit}`);
  }

  if (!signal.reasoning) {
    throw new Error('Missing reasoning');
  }

  // Logical validation: Risk/Reward ratio
  const isBuy = signal.signal === 'BUY' || signal.signal === 'STRONG_BUY';
  const isSell = signal.signal === 'SELL' || signal.signal === 'STRONG_SELL';

  if (isBuy) {
    // For BUY: SL should be < Entry < TP
    if (signal.stop_loss >= signal.entry_price) {
      console.warn('[Validation] BUY signal has SL >= Entry. SL:', signal.stop_loss, 'Entry:', signal.entry_price);
    }
    if (signal.take_profit <= signal.entry_price) {
      console.warn('[Validation] BUY signal has TP <= Entry. TP:', signal.take_profit, 'Entry:', signal.entry_price);
    }
  }

  if (isSell) {
    // For SELL: TP < Entry < SL
    if (signal.stop_loss <= signal.entry_price) {
      console.warn('[Validation] SELL signal has SL <= Entry. SL:', signal.stop_loss, 'Entry:', signal.entry_price);
    }
    if (signal.take_profit >= signal.entry_price) {
      console.warn('[Validation] SELL signal has TP >= Entry. TP:', signal.take_profit, 'Entry:', signal.entry_price);
    }
  }

  // Check minimum R:R ratio (should be at least 1.5:1)
  if (isBuy || isSell) {
    const risk = Math.abs(signal.entry_price - signal.stop_loss);
    const reward = Math.abs(signal.take_profit - signal.entry_price);
    const ratio = risk > 0 ? reward / risk : 0;

    if (ratio < 1.5) {
      console.warn(`[Validation] Poor R:R ratio: 1:${ratio.toFixed(2)} (should be >= 1:1.5)`);
    }
  }
}