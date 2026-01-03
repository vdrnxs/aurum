import * as dotenv from 'dotenv';
import { getSDK, getVaultAddress } from '@/lib/api/sdk-client';

dotenv.config({ path: '.env.local' });

async function testTriggerOrders() {
  try {
    const sdk = getSDK();
    const vault = getVaultAddress();

    console.log('Fetching data for vault:', vault);

    // Try different methods to get trigger orders
    console.log('\n=== Method 1: getUserOpenOrders ===');
    const openOrders = await sdk.info.getUserOpenOrders(vault);
    console.log('Open orders count:', openOrders.length);
    console.log(JSON.stringify(openOrders, null, 2));

    console.log('\n=== Method 2: getClearinghouseState (asset positions) ===');
    const state = await sdk.info.perpetuals.getClearinghouseState(vault);
    console.log('Asset positions:', state.assetPositions.length);

    if (state.assetPositions.length > 0) {
      console.log('\nFirst asset position:');
      console.log(JSON.stringify(state.assetPositions[0], null, 2));
    }

    console.log('\n=== Check SDK info methods ===');
    console.log('Available methods on sdk.info:');
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(sdk.info)));

    console.log('\n=== Check SDK info.perpetuals methods ===');
    console.log('Available methods on sdk.info.perpetuals:');
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(sdk.info.perpetuals)));

  } catch (error) {
    console.error('Error:', error);
  }
}

testTriggerOrders();
