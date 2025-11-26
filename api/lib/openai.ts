const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an expert crypto trader. Analyze BTC market data and provide trading signals.

Guidelines:
- Only signal high-confidence setups (if unclear, return HOLD)
- Set realistic entry/SL/TP based on market structure and volatility
- Consider the full market context, not just individual indicators

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "signal": "BUY" | "SELL" | "HOLD" | "STRONG_BUY" | "STRONG_SELL",
  "confidence": 0-100,
  "entry_price": number,
  "stop_loss": number,
  "take_profit": number,
  "reasoning": "Write a friendly, easy-to-read explanation (2-3 sentences). Explain what you see in the market and why it makes sense to take this trade. Avoid technical jargon - write like you're explaining to a friend. No symbols, no formulas, no comparing numbers. Just clear insights about market direction and opportunity."
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
        {
          role: 'user',
          content: `Analyze BTC/USD on 4h timeframe.

Market data (100 candles + indicators):
${toonData}

What you're looking at:
- OHLCV: Price candles (open, high, low, close, volume)
- SMA/EMA: Moving averages showing trend direction
- RSI: Momentum strength (oversold <30, overbought >70)
- MACD: Trend momentum and reversals
- Bollinger Bands: Volatility and price extremes
- ATR: Current volatility measure
- Parabolic SAR: Trend direction indicator
- Stochastic: Overbought/oversold oscillator

Your analysis:
1. What's the current market regime? (trending up/down, sideways, reversal)
2. Are there clear patterns or confluences suggesting a high-probability trade?
3. Where are key support/resistance levels?
4. Is this a tradeable setup or should we wait?

Provide your trading signal with realistic entry, stop loss, and take profit levels.`
        },
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