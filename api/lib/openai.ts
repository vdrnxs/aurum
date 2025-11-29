const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a selective swing trader specializing in BTC 4h charts. You only take 1 high-quality trade per day.

Data you receive:
- 100 OHLCV candles (open, high, low, close, volume)
- Technical indicators: SMA, EMA, RSI, MACD, Bollinger Bands, ATR, Parabolic SAR, Stochastic

Analysis framework (apply in this order):
1. Trend context: Analyze last 50+ candles. Bullish, bearish, or ranging?
2. Price action: Identify swing highs/lows. Breaking structure or respecting levels?
3. Volume confirmation: Strong moves need volume support. Low volume = weak signal.
4. Indicator confluence: RSI, MACD, MAs must align with trend.
5. Risk zone: Where is setup invalidated? That's your stop loss.

Entry criteria (ALL must be met):
- Clear established trend with momentum
- Pullback to key support/resistance (never chase breakouts)
- Volume confirms the direction
- Multiple indicators agree (confluence)
- Can achieve MINIMUM 3:1 reward-to-risk ratio

Exit rules:
- Stop loss: Below structure that invalidates setup
- Take profit: Realistic target using swing distances and ATR

If ANY criterion fails, return HOLD. Quality over quantity wins.

Return JSON:
{"signal":"BUY|SELL|HOLD|STRONG_BUY|STRONG_SELL","confidence":0-100,"entry_price":number,"stop_loss":number,"take_profit":number,"reasoning":"concise 2-3 sentence summary of key factors"}`;

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
        {
          role: 'user',
          content: `Market data:

${toonData}

Apply your analysis framework and provide your signal.`
        },
      ],
      temperature: 0.9,
      max_tokens: 500,
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
 * Validates trading signal structure and logic
 */
function validateSignal(signal: any): asserts signal is TradingSignal {
  const validSignals = ['BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL'];

  // 1. Validate basic fields
  if (!validSignals.includes(signal.signal)) {
    throw new Error(`Invalid signal type: ${signal.signal}`);
  }

  if (typeof signal.confidence !== 'number' || signal.confidence < 0 || signal.confidence > 100) {
    throw new Error(`Invalid confidence: ${signal.confidence} (must be 0-100)`);
  }

  if (!signal.reasoning || signal.reasoning.length < 10) {
    throw new Error('Reasoning is missing or too short');
  }

  const isBuy = signal.signal === 'BUY' || signal.signal === 'STRONG_BUY';
  const isSell = signal.signal === 'SELL' || signal.signal === 'STRONG_SELL';
  const isHold = signal.signal === 'HOLD';

  // 2. Handle HOLD signals (set defaults if missing)
  if (isHold) {
    signal.entry_price = signal.entry_price ?? 0;
    signal.stop_loss = signal.stop_loss ?? 0;
    signal.take_profit = signal.take_profit ?? 0;
    return; // No further validation needed for HOLD
  }

  // 3. Validate trade signals (BUY/SELL) have all price fields
  if (typeof signal.entry_price !== 'number' || signal.entry_price <= 0) {
    throw new Error(`Invalid entry_price: ${signal.entry_price}`);
  }

  if (typeof signal.stop_loss !== 'number' || signal.stop_loss <= 0) {
    throw new Error(`Invalid stop_loss: ${signal.stop_loss}`);
  }

  if (typeof signal.take_profit !== 'number' || signal.take_profit <= 0) {
    throw new Error(`Invalid take_profit: ${signal.take_profit}`);
  }

  // 4. Validate price order logic
  if (isBuy && signal.stop_loss >= signal.entry_price) {
    throw new Error(`BUY signal: stop_loss (${signal.stop_loss}) must be below entry (${signal.entry_price})`);
  }

  if (isBuy && signal.take_profit <= signal.entry_price) {
    throw new Error(`BUY signal: take_profit (${signal.take_profit}) must be above entry (${signal.entry_price})`);
  }

  if (isSell && signal.stop_loss <= signal.entry_price) {
    throw new Error(`SELL signal: stop_loss (${signal.stop_loss}) must be above entry (${signal.entry_price})`);
  }

  if (isSell && signal.take_profit >= signal.entry_price) {
    throw new Error(`SELL signal: take_profit (${signal.take_profit}) must be below entry (${signal.entry_price})`);
  }

  // 5. Validate R:R ratio (minimum 3:1 for swing trading)
  const risk = Math.abs(signal.entry_price - signal.stop_loss);
  const reward = Math.abs(signal.take_profit - signal.entry_price);
  const ratio = risk > 0 ? reward / risk : 0;

  if (ratio < 3.0) {
    console.warn(`[Warning] R:R ratio is ${ratio.toFixed(2)}:1 (target: 3:1). Signal may not be optimal.`);
  }

  // 6. Log round numbers warning (informational only)
  const isRoundNumber = (price: number) => price % 1000 === 0 || price % 5000 === 0;

  if (isRoundNumber(signal.stop_loss) || isRoundNumber(signal.take_profit)) {
    console.warn(`[Warning] Psychological levels detected. SL: ${signal.stop_loss}, TP: ${signal.take_profit}`);
  }
}