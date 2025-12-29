import { Hyperliquid } from 'hyperliquid';
import { createLogger } from './logger';

const log = createLogger('sdk-client');

let sdkInstance: Hyperliquid | null = null;

/**
 * Get or create singleton Hyperliquid SDK instance
 * Prevents multiple SDK instantiations and ensures consistent configuration
 */
export function getSDK(): Hyperliquid {
  if (sdkInstance) {
    return sdkInstance;
  }

  const privateKey = process.env.HYPERLIQUID_API_WALLET_PRIVATE_KEY;
  const isTestnet = process.env.HYPERLIQUID_TESTNET === 'true';

  if (!privateKey) {
    throw new Error('HYPERLIQUID_API_WALLET_PRIVATE_KEY not configured');
  }

  log.info('Initializing Hyperliquid SDK', { testnet: isTestnet });

  sdkInstance = new Hyperliquid({
    privateKey,
    testnet: isTestnet,
    enableWs: false,
  });

  return sdkInstance;
}

/**
 * Get wallet address from environment variables
 */
export function getWalletAddress(): string {
  const address = process.env.HYPERLIQUID_WALLET_ADDRESS;

  if (!address) {
    throw new Error('HYPERLIQUID_WALLET_ADDRESS not configured');
  }

  return address;
}

/**
 * Reset SDK instance (useful for testing)
 */
export function resetSDK(): void {
  sdkInstance = null;
  log.info('SDK instance reset');
}