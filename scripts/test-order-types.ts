import * as dotenv from 'dotenv';
import { getSDK, getVaultAddress } from '@/lib/api/sdk-client';

dotenv.config({ path: '.env.local' });

async function testOrderTypes() {
  try {
    const sdk = getSDK();
    const vault = getVaultAddress();

    console.log('Fetching open orders for vault:', vault);
    const orders = await sdk.info.getUserOpenOrders(vault);

    console.log('\n=== ALL ORDERS (RAW) ===');
    console.log(JSON.stringify(orders, null, 2));

    if (orders && orders.length > 0) {
      console.log('\n=== FIRST ORDER KEYS ===');
      console.log(Object.keys(orders[0]));

      console.log('\n=== ORDER DETAILS ===');
      orders.forEach((order, idx: number) => {
        console.log(`\n--- Order ${idx + 1} (ID: ${order.oid}) ---`);
        console.log('Coin:', order.coin);
        console.log('Side:', order.side);
        console.log('Price:', order.limitPx);
        console.log('Size:', order.sz);
        console.log('Timestamp:', order.timestamp);
        console.log('Order Type:', order.orderType);
        console.log('Reduce Only:', order.reduceOnly);
        console.log('Grouping:', order.grouping);
        console.log('TPSL:', order.orderType?.trigger?.tpsl);
        console.log('Full order:', JSON.stringify(order, null, 2));
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testOrderTypes();
