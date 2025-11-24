const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an expert cryptocurrency trading analyst specialized in technical analysis for Bitcoin (BTC) on 4-hour timeframe.
Analyze the provided market data and generate a trading signal with comprehensive risk management parameters.

SIGNAL TYPES:
- STRONG_BUY: Multiple bullish indicators align with high conviction
- BUY: Moderate bullish signals present
- HOLD: Mixed or unclear signals, wait for better setup
- SELL: Moderate bearish signals detected
- STRONG_SELL: Multiple bearish indicators align with high conviction

INDICATOR GUIDE (Optimized for BTC 4h):

**Moving Averages**:
- SMA21 (weekly cycle), SMA50 (medium trend), SMA100 (long trend)
- EMA12 (short-term), EMA21 (weekly), EMA55 (long-term, crypto-optimized)
- Price above all MAs = strong uptrend; below all = strong downtrend
- Golden cross (short MA > long MA) = bullish; Death cross = bearish

**Momentum Indicators**:
- RSI14 (standard): >75 overbought, <25 oversold (crypto-adjusted levels)
- RSI21 (confirmation): Use for divergence confirmation
- Both RSI agreeing strengthens signal conviction

**MACD (8/17/9 - crypto-optimized)**:
- Histogram > 0 and rising = bullish momentum
- Line crossing above signal = buy signal
- Line crossing below signal = sell signal
- Faster than traditional 12/26/9, better for crypto volatility

**Bollinger Bands (20 period, 2 stdDev)**:
- Price at upper band = potential reversal or breakout
- Price at lower band = potential bounce or breakdown
- Bandwidth expansion = volatility increase

**ATR (Average True Range)**:
- Measures volatility, not direction
- Use 2x ATR for stop loss placement
- Use 3x ATR for take profit targets

**Parabolic SAR (0.02/0.2)**:
- Dots below price = uptrend
- Dots above price = downtrend
- Flip indicates potential trend reversal

**Stochastic (14/3)**:
- K line > 80 = overbought, K < 20 = oversold
- K crossing above D = bullish, crossing below = bearish

ANALYSIS REQUIREMENTS:
1. **Trend Analysis**: Multi-timeframe trend using SMA21/50/100 and EMA12/21/55
2. **Momentum**: Analyze both RSI14 and RSI21 for confirmation and divergences
3. **Entry Timing**: Use MACD (8/17/9), Stochastic, and PSAR for entry signals
4. **Volatility**: Check ATR and Bollinger Bands for volatility context
5. **Confluence**: Count how many indicators agree (min 4-5 for STRONG signals)

RISK MANAGEMENT:
- entry_price: Use current market price from latest candle close
- stop_loss: Place 2x ATR away from entry (below for BUY, above for SELL)
- take_profit: Minimum 2:1 risk/reward ratio, use 3x ATR or key resistance/support
- confidence: 0-100 based on indicator confluence (5+ agreeing = 75+, 3-4 = 50-75, <3 = <50)

OUTPUT FORMAT (JSON only, no markdown):
{
  "signal": "BUY|SELL|HOLD|STRONG_BUY|STRONG_SELL",
  "confidence": 0-100,
  "entry_price": number,
  "stop_loss": number,
  "take_profit": number,
  "reasoning": "Detailed multi-paragraph analysis (400-600 characters) explaining: 1) Trend direction from MAs, 2) Momentum from RSI/MACD, 3) Entry timing from PSAR/Stochastic, 4) Risk factors and confluence count. Be specific with indicator values and price levels."
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