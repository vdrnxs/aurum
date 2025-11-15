import * as hl from '@nktkas/hyperliquid';
import { config } from './config.js';
import { upsertCandle } from './supabase.js';
import { transformCandle } from './transformer.js';
import type { HyperliquidCandle } from './types.js';

async function main() {
  console.log('Starting Hyperliquid WebSocket to Supabase ingestion...');
  console.log('Symbols:', config.hyperliquid.symbols.join(', '));
  console.log('Interval:', config.hyperliquid.interval);
  console.log('---');

  const subscriptionClient = new hl.SubscriptionClient({
    transport: new hl.WebSocketTransport(),
  });

  for (const symbol of config.hyperliquid.symbols) {
    console.log(`Subscribing to ${symbol} ${config.hyperliquid.interval} candles...`);

    await subscriptionClient.candle(
      { coin: symbol, interval: config.hyperliquid.interval },
      async (candle: HyperliquidCandle) => {
        try {
          const transformed = transformCandle(candle);
          await upsertCandle(transformed);
        } catch (error) {
          console.error(`Error processing candle for ${symbol}:`, error);
        }
      }
    );

    console.log(`Subscribed to ${symbol}`);
  }

  console.log('---');
  console.log('All subscriptions active. Listening for candles...');

  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await subscriptionClient.disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
