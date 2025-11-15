import type { HyperliquidCandle, CandleInsert } from './types.js';

export function transformCandle(hlCandle: HyperliquidCandle): CandleInsert {
  return {
    symbol: hlCandle.s,
    interval: hlCandle.i,
    open_time: hlCandle.t,
    close_time: hlCandle.T,
    open: parseFloat(hlCandle.o),
    high: parseFloat(hlCandle.h),
    low: parseFloat(hlCandle.l),
    close: parseFloat(hlCandle.c),
    volume: parseFloat(hlCandle.v),
    trades_count: hlCandle.n,
  };
}
