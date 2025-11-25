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

SIGNAL RULES:
- STRONG_BUY/STRONG_SELL: 5+ indicators agree, high confluence
- BUY/SELL: 3-4 indicators agree, moderate setup
- HOLD: <3 indicators agree or conflicting signals

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
- Confidence: (agreeing_indicators / 8) * 100, round to integer

ANALYSIS CHECKLIST:
✓ Trend: Price position vs SMA21/50/100 and EMA12/21/55
✓ Momentum: RSI14 vs RSI21 agreement, MACD histogram direction
✓ Extremes: Stochastic overbought/oversold, price vs BB
✓ Reversal: PSAR trend flip, divergences
✓ Count confluence (how many indicators agree)

OUTPUT (JSON only, no markdown):
{
  "signal": "STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL",
  "confidence": 0-100,
  "entry_price": number,
  "stop_loss": number,
  "take_profit": number,
  "reasoning": "Concise analysis (300-500 chars): 1) Trend direction, 2) Momentum signals, 3) Entry rationale, 4) Key risks. Use specific values (e.g., 'RSI14=72, overbought')."
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
  return signal;
}

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
}