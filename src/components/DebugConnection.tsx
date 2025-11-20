import { useState } from 'react';
import { Card, Title, Text, Button } from '@tremor/react';
import { supabase } from '../lib/supabase';
import { HyperliquidService } from '../services/hyperliquid';
import { DataService } from '../services/dataService';

export function DebugConnection() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSupabaseRead = async () => {
    addLog('🔵 Testing Supabase READ...');
    try {
      const { data, error } = await supabase
        .from('candles')
        .select('*')
        .limit(1);

      if (error) throw error;

      addLog(`✅ Supabase READ works! Found ${data?.length || 0} rows`);
      if (data && data.length > 0) {
        addLog(`Sample: ${JSON.stringify(data[0])}`);
      }
    } catch (error) {
      addLog(`❌ Supabase READ failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testSupabaseWrite = async () => {
    addLog('🔵 Testing Supabase WRITE...');
    try {
      const testCandle = {
        symbol: 'TEST',
        interval: '1h',
        open_time: Date.now(),
        close_time: Date.now() + 3600000,
        open: 100,
        high: 105,
        low: 95,
        close: 102,
        volume: 1000,
        trades_count: 50,
      };

      const { data, error } = await supabase
        .from('candles')
        .insert([testCandle])
        .select();

      if (error) throw error;

      addLog(`✅ Supabase WRITE works! Inserted ${data?.length || 0} rows`);
    } catch (error) {
      addLog(`❌ Supabase WRITE failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addLog('⚠️  Check RLS policies! You might need to run: supabase/enable-frontend-insert.sql');
    }
  };

  const testHyperliquid = async () => {
    addLog('🔵 Testing Hyperliquid API...');
    try {
      const candles = await HyperliquidService.getCandles('BTC', '1h', 5);
      addLog(`✅ Hyperliquid API works! Got ${candles.length} candles`);
      if (candles.length > 0) {
        addLog(`Latest candle: ${JSON.stringify({
          symbol: candles[0].symbol,
          close: candles[0].close,
          time: new Date(candles[0].open_time).toLocaleString(),
        })}`);
      }
    } catch (error) {
      addLog(`❌ Hyperliquid API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testFullFlow = async () => {
    setLoading(true);
    addLog('🔵 Testing FULL FLOW (Hybrid Service)...');
    try {
      const result = await DataService.getCandles('BTC', '1h', 10, {
        forceRefresh: true,
      });

      addLog(`✅ Full flow works!`);
      addLog(`Source: ${result.source}`);
      addLog(`Candles: ${result.candles.length}`);
      addLog(`Fresh: ${result.isFresh}`);
    } catch (error) {
      addLog(`❌ Full flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Title>Debug Connection</Title>
      <Text className="mt-2">Test each step individually to find the problem</Text>

      <div className="mt-6 space-y-2">
        <Button onClick={testSupabaseRead} size="xs">
          1. Test Supabase READ
        </Button>
        <Button onClick={testSupabaseWrite} size="xs" className="ml-2">
          2. Test Supabase WRITE
        </Button>
        <Button onClick={testHyperliquid} size="xs" className="ml-2">
          3. Test Hyperliquid API
        </Button>
        <Button onClick={testFullFlow} size="xs" className="ml-2" loading={loading}>
          4. Test Full Flow
        </Button>
      </div>

      <div className="mt-6">
        <Text className="font-semibold">Logs:</Text>
        <div className="mt-2 p-4 bg-gray-50 rounded h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <Text className="text-gray-400">No logs yet. Click a button to start testing.</Text>
          ) : (
            <pre className="text-xs whitespace-pre-wrap">
              {logs.join('\n')}
            </pre>
          )}
        </div>
      </div>
    </Card>
  );
}
