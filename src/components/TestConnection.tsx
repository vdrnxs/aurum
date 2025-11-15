import { supabase } from '../lib/supabase';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { ConnectionStatus } from './ConnectionStatus';
import { CandleDataDisplay } from './CandleDataDisplay';
import { TroubleshootingGuide } from './TroubleshootingGuide';
import type { Candle } from '../types/database';

const CANDLES_LIMIT = 5;

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
  const { data: candles, isSuccess, isError, error } = useSupabaseQuery(fetchLatestCandles);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>

      <ConnectionStatus
        isSuccess={isSuccess}
        isError={isError}
        error={error}
      />

      {isSuccess && (
        <>
          <p className="mt-2 text-gray-700">
            Found {candles?.length || 0} candles in database
          </p>
          <CandleDataDisplay candles={candles || []} />
        </>
      )}

      {isError && <TroubleshootingGuide />}
    </div>
  );
}
