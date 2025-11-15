import dotenv from 'dotenv';

dotenv.config();

interface Config {
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  hyperliquid: {
    symbols: string[];
    interval: string;
  };
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function parseSymbols(symbolsString: string): string[] {
  return symbolsString
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export const config: Config = {
  supabase: {
    url: getEnvVar('SUPABASE_URL'),
    serviceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  },
  hyperliquid: {
    symbols: parseSymbols(getEnvVar('SYMBOLS')),
    interval: getEnvVar('INTERVAL'),
  },
};
