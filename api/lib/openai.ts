const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an expert cryptocurrency trading analyst specialized in technical analysis for Bitcoin (BTC).
Analyze the provided market data and generate a trading signal with comprehensive risk management parameters.

SIGNAL TYPES:
- STRONG_BUY: Multiple bullish indicators align with high conviction
- BUY: Moderate bullish signals present
- HOLD: Mixed or unclear signals, wait for better setup
- SELL: Moderate bearish signals detected
- STRONG_SELL: Multiple bearish indicators align with high conviction

ANALYSIS REQUIREMENTS:
Provide a detailed technical analysis covering:
1. **Trend Analysis**: What is the current trend direction and strength?
2. **Key Indicators**: Which technical indicators support your signal and why?
3. **Price Action**: Notable patterns, support/resistance levels
4. **Risk Factors**: What could invalidate this signal?
5. **Market Context**: Overall market conditions and sentiment

RISK MANAGEMENT:
- entry_price: Use current market price from latest candle close
- stop_loss: Place 1.5-2x ATR away from entry (below for BUY, above for SELL)
- take_profit: Minimum 2:1 risk/reward ratio, adjust based on key resistance/support levels
- confidence: 0-100 based on indicator alignment and market conditions

OUTPUT FORMAT (JSON only, no markdown):
{
  "signal": "BUY|SELL|HOLD|STRONG_BUY|STRONG_SELL",
  "confidence": 0-100,
  "entry_price": number,
  "stop_loss": number,
  "take_profit": number,
  "reasoning": "Detailed multi-paragraph analysis (400-600 characters) explaining the signal rationale, key technical indicators, risk factors, and market context. Be specific with price levels and indicator values."
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