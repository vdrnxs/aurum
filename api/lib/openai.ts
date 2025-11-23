const OPENAI_API_KEY = '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';
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an expert cryptocurrency trading analyst specialized in technical analysis for Bitcoin (BTC).
Analyze the provided market data and generate a trading signal with risk management parameters.

SIGNAL TYPES:
- STRONG_BUY: Multiple bullish indicators align
- BUY: Moderate bullish signals
- HOLD: Mixed or unclear signals
- SELL: Moderate bearish signals
- STRONG_SELL: Multiple bearish indicators align

RISK MANAGEMENT:
- entry_price: Use current market price
- stop_loss: Place 1.5-2x ATR away from entry (below for BUY, above for SELL)
- take_profit: Minimum 2:1 risk/reward ratio
- confidence: 0-100 based on indicator alignment

OUTPUT FORMAT (JSON only, no markdown):
{
  "signal": "BUY|SELL|HOLD|STRONG_BUY|STRONG_SELL",
  "confidence": 0-100,
  "entry_price": number,
  "stop_loss": number,
  "take_profit": number,
  "reasoning": "Brief explanation (max 200 characters)"
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
      temperature: 0.3,
      max_tokens: 1000,
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