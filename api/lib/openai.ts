import { z } from 'zod';
import { AI_CONFIG, PRICE_VALIDATION } from './constants.js';
import { createLogger } from './logger.js';

const log = createLogger('openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = AI_CONFIG.MODEL;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Validate API key is configured
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not configured');
}

// Zod schema for runtime validation of AI responses
const TradingSignalSchema = z.object({
  signal: z.enum(['BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL']),
  confidence: z.number().min(0).max(100),
  entry_price: z.number(),
  stop_loss: z.number(),
  take_profit: z.number(),
  reasoning: z.string().min(10, 'Reasoning must be at least 10 characters'),
});

const SYSTEM_PROMPT = `Eres un trader especializado en criptomonedas. Tu tarea es analizar el mercado de BTCUSD.`;

export interface TradingSignal {
  signal: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
  confidence: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  reasoning: string;
}

export async function analyzeTradingSignal(toonData: string): Promise<TradingSignal> {
  log.info('Analyzing market data with GPT-4o-mini');

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

Con los indicadores que te he proporcionado detrmina la dirección del mercado.
Determina el criterio de entrada en un punto clave.
Tus reglas de salida son para tp atr x3 y sl atr x1.5.

Ejemplo de salida en formato json:
{"signal":"BUY|SELL|HOLD|STRONG_BUY|STRONG_SELL","confidence":0-100,"entry_price":number,"stop_loss":number,"take_profit":number,"reasoning":"Resumen breve y claro en pocas frases de los factores clave of key factors"}
`
        },
      ],
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    log.error('OpenAI API request failed', null, { status: response.status, error });
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    log.error('Empty response from OpenAI');
    throw new Error('No response from OpenAI');
  }

  // Parse and validate with Zod (runtime type safety)
  const parsedContent = JSON.parse(content);
  const signal = TradingSignalSchema.parse(parsedContent);

  // Additional business logic validation
  validateSignalLogic(signal);

  log.info('Trading signal generated', {
    signal: signal.signal,
    confidence: signal.confidence,
    entry: signal.entry_price,
    stopLoss: signal.stop_loss,
    takeProfit: signal.take_profit,
  });

  return signal;
}

/**
 * Validates trading signal business logic (price relationships, R:R ratio, etc.)
 * Zod handles basic type validation, this handles domain-specific rules
 */
function validateSignalLogic(signal: TradingSignal): void {
  const isBuy = signal.signal === 'BUY' || signal.signal === 'STRONG_BUY';
  const isSell = signal.signal === 'SELL' || signal.signal === 'STRONG_SELL';
  const isHold = signal.signal === 'HOLD';

  // HOLD signals don't need price validation
  if (isHold) {
    return;
  }

  // Validate trade signals (BUY/SELL) have positive prices
  if (signal.entry_price <= 0) {
    throw new Error(`Invalid entry_price: ${signal.entry_price}`);
  }

  if (signal.stop_loss <= 0) {
    throw new Error(`Invalid stop_loss: ${signal.stop_loss}`);
  }

  if (signal.take_profit <= 0) {
    throw new Error(`Invalid take_profit: ${signal.take_profit}`);
  }

  // Validate price order logic
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

  // Validate R:R ratio (minimum 3:1 for swing trading)
  const risk = Math.abs(signal.entry_price - signal.stop_loss);
  const reward = Math.abs(signal.take_profit - signal.entry_price);
  const ratio = risk > 0 ? reward / risk : 0;

  if (ratio < AI_CONFIG.MIN_RR_RATIO) {
    console.warn(`[Warning] R:R ratio is ${ratio.toFixed(2)}:1 (target: ${AI_CONFIG.MIN_RR_RATIO}:1). Signal may not be optimal.`);
  }

  // Log round numbers warning (informational only)
  const isRoundNumber = (price: number) =>
    PRICE_VALIDATION.PSYCHOLOGICAL_LEVELS.some(level => price % level === 0);

  if (isRoundNumber(signal.stop_loss) || isRoundNumber(signal.take_profit)) {
    console.warn(`[Warning] Psychological levels detected. SL: ${signal.stop_loss}, TP: ${signal.take_profit}`);
  }
}