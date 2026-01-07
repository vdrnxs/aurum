import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { z } from 'zod';
import { AI_CONFIG, ATR_CONFIG, PRICE_VALIDATION } from './constants';
import { createLogger } from './logger';

const log = createLogger('ai');

// Validate API key is configured
if (!process.env.CEREBRAS_API_KEY) {
  throw new Error('CEREBRAS_API_KEY environment variable is not configured');
}

// Initialize Cerebras client (singleton)
const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

// Zod schema for runtime validation of AI responses
// HOLD signals can have 0 values for prices (no trade action)
const TradingSignalSchema = z.object({
  signal: z.enum(['BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL']),
  confidence: z.number().min(0).max(100),
  entry_price: z.number().default(0),
  stop_loss: z.number().default(0),
  take_profit: z.number().default(0),
  reasoning: z.string().min(10, 'Reasoning must be at least 10 characters'),
}).refine((data) => {
  // For HOLD signals, prices can be 0
  if (data.signal === 'HOLD') {
    return true;
  }
  // For BUY/SELL signals, all prices must be positive
  return (data.entry_price ?? 0) > 0 && (data.stop_loss ?? 0) > 0 && (data.take_profit ?? 0) > 0;
}, {
  message: 'BUY/SELL signals must have positive entry_price, stop_loss, and take_profit',
});

const SYSTEM_PROMPT = `Eres un trader especializado en criptomonedas. Analiza el mercado de BTCUSD y genera una señal de trading en formato JSON.

IMPORTANTE: El confidence no solo refleja la dirección del mercado, sino la probabilidad de éxito de la operación teniendo en cuenta divergencias, indicadores inflados (sobrecompra/sobreventa), y señales contradictorias.

Para BUY/SELL: entry_price, stop_loss y take_profit deben ser números positivos.
Para HOLD: usa 0 para entry_price, stop_loss y take_profit.

Formato:
{"signal":"BUY|SELL|HOLD|STRONG_BUY|STRONG_SELL","confidence":0-100,"entry_price":number,"stop_loss":number,"take_profit":number,"reasoning":"Análisis breve (máx 5 frases, en español)"}
`;

export interface TradingSignal {
  signal: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
  confidence: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  reasoning: string;
}

export async function analyzeTradingSignal(toonData: string): Promise<TradingSignal> {
  log.info('Analyzing market data with Cerebras z.ai-glm-4.6');

  const response = await cerebras.chat.completions.create({
    model: AI_CONFIG.MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Market data:

${toonData}

Con los indicadores que te he proporcionado, determina la dirección del mercado y encuentra el mejor precio de entrada. Tus reglas de salida son para TP atr x${ATR_CONFIG.MULTIPLIER_TP} y para SL atr x${ATR_CONFIG.MULTIPLIER_SL}. Para finalizar, agrega en el análisis una recomendación clara sobre qué hacer con una operación abierta (ya sea long o short) en función de la dirección detectada y de la señal final (strong buy, buy, hold, sell o strong sell).
`
      },
    ],
    temperature: AI_CONFIG.TEMPERATURE,
    max_completion_tokens: AI_CONFIG.MAX_TOKENS,
    top_p: 0.95,
    response_format: { type: "json_object" },
  });

  // Extract content from response
  // z.ai-glm-4.6 with response_format puts the JSON in the 'message' field, not 'content'
  const messageObj = (response as { choices?: Array<{ message?: unknown }> })?.choices?.[0]?.message as {
    message?: string;
    content?: string;
    reasoning?: string;
  } | undefined;
  const content = messageObj?.message || messageObj?.content || messageObj?.reasoning;
  const finishReason = (response as { choices?: Array<{ finish_reason?: string }> })?.choices?.[0]?.finish_reason;

  if (!content) {
    log.error('Empty response from Cerebras', {
      response: JSON.stringify(response).substring(0, 500),
      messageObj: JSON.stringify(messageObj)
    });
    throw new Error('No response from AI provider');
  }

  if (finishReason === 'length') {
    log.warn('Response truncated due to max_tokens limit', { finishReason });
  }

  log.debug('Raw AI response', { content: content.substring(0, 200) });

  // Extract JSON from response (model may include text before/after JSON)
  let jsonString = content.trim();

  // Try to find JSON object in the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonString = jsonMatch[0];
  }

  // Parse and validate with Zod (runtime type safety)
  let parsedContent;
  try {
    parsedContent = JSON.parse(jsonString);
  } catch (error) {
    log.error('Failed to parse AI response as JSON', {
      content: content.substring(0, 500),
      jsonString: jsonString.substring(0, 500),
      error
    });
    throw new Error(`Invalid JSON response from AI: ${content.substring(0, 100)}`);
  }

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
    log.warn('R:R ratio below target', {
      ratio: ratio.toFixed(2),
      target: AI_CONFIG.MIN_RR_RATIO,
      entry: signal.entry_price,
      stopLoss: signal.stop_loss,
      takeProfit: signal.take_profit,
    });
  }

  // Log round numbers warning (informational only)
  const isRoundNumber = (price: number) =>
    PRICE_VALIDATION.PSYCHOLOGICAL_LEVELS.some(level => price % level === 0);

  if (isRoundNumber(signal.stop_loss) || isRoundNumber(signal.take_profit)) {
    log.warn('Psychological levels detected', {
      stopLoss: signal.stop_loss,
      takeProfit: signal.take_profit,
      levels: PRICE_VALIDATION.PSYCHOLOGICAL_LEVELS,
    });
  }
}