import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

interface TradingViewChartProps {
  symbol?: string;
  interval?: '1' | '3' | '5' | '15' | '30' | '60' | '120' | '180' | '240' | 'D' | 'W';
  theme?: 'light' | 'dark';
}

export function TradingViewChart({
  symbol = 'BINANCE:BTCUSDT',
  interval = '240',
  theme = 'dark',
}: TradingViewChartProps) {
  return (
    <div className="w-full h-full relative overflow-hidden">
      <AdvancedRealTimeChart
        symbol={symbol}
        interval={interval}
        theme={theme}
        autosize
        hide_side_toolbar={false}
        allow_symbol_change={false}
        save_image={false}
        calendar={false}
      />
      <style>{`
        .tradingview-widget-copyright {
          display: none !important;
        }
      `}</style>
    </div>
  );
}