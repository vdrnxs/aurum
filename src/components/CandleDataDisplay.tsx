import type { Candle } from '../types/database';

interface CandleDataDisplayProps {
  candles: Candle[];
}

export function CandleDataDisplay({ candles }: CandleDataDisplayProps) {
  if (candles.length === 0) {
    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">
          No data available. Run the backend script to populate the database.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Latest Candles</h3>
      <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
        {JSON.stringify(candles, null, 2)}
      </pre>
    </div>
  );
}
