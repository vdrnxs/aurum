import * as dotenv from 'dotenv';
import { getSDK, getVaultAddress } from '@/lib/api/sdk-client';

dotenv.config({ path: '.env.local' });

async function testFrontendOrders() {
  try {
    const sdk = getSDK();
    const vault = getVaultAddress();

    console.log('Fetching frontend open orders for vault:', vault);
    const frontendOrders = await sdk.info.getFrontendOpenOrders(vault);

    console.log('\n=== FRONTEND OPEN ORDERS (RAW) ===');
    console.log(JSON.stringify(frontendOrders, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

testFrontendOrders();
