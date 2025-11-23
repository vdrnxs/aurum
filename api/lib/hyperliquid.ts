const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

interface HyperliquidCandle {
  t: number;  // open_time
  T: number;  // close_time
  s: string;  // symbol
  i: string;  // interval
  o: string;  // open
  c: string;  // close
  h: string;  // high
  l: string;  // low
  v: string;  // volume
  n: number;  // trades_count
}

export interface Candle {
  symbol: string;
  interval: string;
  open_time: number;
  close_time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades_count: number;
}

export async function fetchCandles(
  symbol: string,
  interval: string,
  limit: number = 100
): Promise<Candle[]> {
  const intervalMs = getIntervalInMs(interval);
  const endTime = Date.now();
  const startTime = endTime - limit * intervalMs;

  const response = await fetch(HYPERLIQUID_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'candleSnapshot',
      req: {
        coin: symbol,
        interval,
        startTime,
        endTime,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Hyperliquid API error: ${response.status}`);
  }

  const data: HyperliquidCandle[] = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Invalid response from Hyperliquid');
  }

  return data.map((hc) => ({
    symbol: hc.s,
    interval: hc.i,
    open_time: hc.t,
    close_time: hc.T,
    open: parseFloat(hc.o),
    high: parseFloat(hc.h),
    low: parseFloat(hc.l),
    close: parseFloat(hc.c),
    volume: parseFloat(hc.v),
    trades_count: hc.n,
  }));
}

function getIntervalInMs(interval: string): number {
  const map: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };
  return map[interval] || 60 * 60 * 1000;
}