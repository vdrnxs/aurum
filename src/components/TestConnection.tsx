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
          <CandleDataDisplay candles={candles || []} />
          <div className="mt-3 px-4 text-sm text-gray-500">
             {candles?.length || 0} candles
          </div>
        </>
      )}

      {isError && <TroubleshootingGuide />}
    </div>
  );
}
