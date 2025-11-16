import { supabase } from '../lib/supabase';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { CandleDataDisplay } from './CandleDataDisplay';
import { TroubleshootingGuide } from './TroubleshootingGuide';
import type { Candle } from '../types/database';

const CANDLES_LIMIT = 10;

async function fetchLatestCandles(): Promise<Candle[]> {
  const { data, error } = await supabase
    .from('candles')
    .select('*')
    .limit(CANDLES_LIMIT)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export function TestConnection() {
  const { data: candles, isSuccess, isError } = useSupabaseQuery(fetchLatestCandles);

  return (
    <div>
      {isSuccess && (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <h2 className="text-zinc-300 font-light">Market Data</h2>
            <span className="text-zinc-600 text-sm">{candles?.length || 0} candles</span>
          </div>
          <CandleDataDisplay candles={candles || []} />
        </>
      )}

      {isError && <TroubleshootingGuide />}
    </div>
  );
}
