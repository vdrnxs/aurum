import * as dotenv from 'dotenv';
import { getSDK, getVaultAddress } from '@/lib/api/sdk-client';

dotenv.config({ path: '.env.local' });

async function explorePositionOrders() {
  try {
    const sdk = getSDK();
    const vault = getVaultAddress();

    console.log('=== EXPLORING POSITIONS AND ORDERS RELATIONSHIP ===\n');

    // Get positions
    const state = await sdk.info.perpetuals.getClearinghouseState(vault);
    const positions = state.assetPositions;

    console.log('POSITIONS:');
    console.log(`Found ${positions.length} position(s)\n`);

    positions.forEach((pos, idx) => {
      console.log(`Position ${idx + 1}:`);
      console.log('  Coin:', pos.position.coin);
      console.log('  Size:', pos.position.szi);
      console.log('  Entry Px:', pos.position.entryPx);
      console.log('  Unrealized PnL:', pos.position.unrealizedPnl);
      console.log('  Leverage:', pos.position.leverage.value);
      console.log('  Full data:', JSON.stringify(pos, null, 2));
      console.log('---\n');
    });

    // Get frontend orders
    const orders = await sdk.info.getFrontendOpenOrders(vault);

    console.log('\nORDERS:');
    console.log(`Found ${orders.length} order(s)\n`);

    orders.forEach((order, idx) => {
      console.log(`Order ${idx + 1} (ID: ${order.oid}):`);
      console.log('  Coin:', order.coin);
      console.log('  Side:', order.side);
      console.log('  Order Type:', order.orderType);
      console.log('  Limit Price:', order.limitPx);
      console.log('  Trigger Price:', order.triggerPx);
      console.log('  Size:', order.sz);
      console.log('  Reduce Only:', order.reduceOnly);
      console.log('  Is Trigger:', order.isTrigger);
      console.log('  Is Position TPSL:', order.isPositionTpsl);
      console.log('  Trigger Condition:', order.triggerCondition);
      console.log('  Grouping:', order.grouping);
      console.log('---\n');
    });

    // Try to match orders to positions
    console.log('\n=== ATTEMPTING TO MATCH ORDERS TO POSITIONS ===\n');

    positions.forEach((pos) => {
      const coin = pos.position.coin;
      const relatedOrders = orders.filter(o => o.coin === coin && o.reduceOnly);

      console.log(`Position: ${coin}`);
      console.log(`  Related reduce-only orders: ${relatedOrders.length}`);

      relatedOrders.forEach((order) => {
        const orderType = order.orderType?.includes('Stop') ? 'STOP LOSS' :
                         order.orderType?.includes('Take Profit') ? 'TAKE PROFIT' : 'OTHER';
        console.log(`    - ${orderType}: Price ${order.limitPx || order.triggerPx}, isPositionTpsl: ${order.isPositionTpsl}`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

explorePositionOrders();
