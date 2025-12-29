/**
 * Test LIMIT order with SL/TP on Hyperliquid testnet
 * BTC/USDC LONG position
 *
 * Usage: npx tsx scripts/test-limit-order.ts
 */

import * as dotenv from 'dotenv';
import { Hyperliquid } from 'hyperliquid';

dotenv.config({ path: '.env.local' });

async function testLimitOrder() {
  console.log('=== BTC LIMIT Order Test ===\n');

  try {
    const sdk = new Hyperliquid({
      privateKey: process.env.HYPERLIQUID_API_WALLET_PRIVATE_KEY!,
      testnet: true,
      enableWs: false,
    });

    const wallet = process.env.HYPERLIQUID_WALLET_ADDRESS || '0x9C28606164F91EB901ac54C5e68C6a85bC7369f9';

    // Get balance
    console.log('1. Checking balance...');
    const state = await sdk.info.perpetuals.getClearinghouseState(wallet);
    const balance = parseFloat(state.marginSummary.accountValue);
    console.log(`   Balance: $${balance.toFixed(2)}\n`);

    // Order params
    const entryPrice = 88000;    // LIMIT buy at $88k
    const stopLoss = 87000;      // SL at $87k (-1.14%)
    const takeProfit = 90000;    // TP at $90k (+2.27%)
    const positionSize = 0.001;  // Minimum BTC size (~$88)

    console.log('2. Order Params:');
    console.log(`   Entry: $${entryPrice.toLocaleString()}`);
    console.log(`   Stop Loss: $${stopLoss.toLocaleString()}`);
    console.log(`   Take Profit: $${takeProfit.toLocaleString()}`);
    console.log(`   Size: ${positionSize} BTC\n`);

    // Set leverage
    console.log('3. Setting leverage to 1x...');
    await sdk.exchange.updateLeverage('BTC-PERP', 'cross', 1);
    console.log('   Done\n');

    // Place entry order
    console.log('4. Placing LIMIT entry...');
    const entry = await sdk.exchange.placeOrder({
      coin: 'BTC-PERP',
      is_buy: true,
      sz: positionSize,
      limit_px: entryPrice,
      reduce_only: false,
      order_type: { limit: { tif: 'Gtc' } },
    });
    console.log(`   ${entry.status === 'ok' ? '✅' : '❌'} Entry: ${JSON.stringify(entry.response?.data?.statuses)}\n`);

    // Place SL
    console.log('5. Placing Stop Loss...');
    const sl = await sdk.exchange.placeOrder({
      coin: 'BTC-PERP',
      is_buy: false,
      sz: positionSize,
      limit_px: stopLoss,
      reduce_only: true,
      order_type: { trigger: { triggerPx: stopLoss, isMarket: true, tpsl: 'sl' } },
      grouping: 'positionTpsl',
    });
    console.log(`   ${sl.status === 'ok' ? '✅' : '❌'} SL: ${JSON.stringify(sl.response?.data?.statuses)}\n`);

    // Place TP
    console.log('6. Placing Take Profit...');
    const tp = await sdk.exchange.placeOrder({
      coin: 'BTC-PERP',
      is_buy: false,
      sz: positionSize,
      limit_px: takeProfit,
      reduce_only: true,
      order_type: { trigger: { triggerPx: takeProfit, isMarket: true, tpsl: 'tp' } },
      grouping: 'positionTpsl',
    });
    console.log(`   ${tp.status === 'ok' ? '✅' : '❌'} TP: ${JSON.stringify(tp.response?.data?.statuses)}\n`);

    console.log('=== Test Complete ===');
    console.log(`✅ Order placed and waiting in DEX order book`);
    console.log(`📝 Will fill when BTC touches $${entryPrice.toLocaleString()}`);

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

testLimitOrder();
