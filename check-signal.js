import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestSignal() {
  const { data, error } = await supabase
    .from('btc_trading_signals')
    .select('id, symbol, signal, entry_price, stop_loss, take_profit, confidence, created_at')
    .eq('symbol', 'BTC')
    .eq('interval', '4h')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data) {
    console.log('No signal found in database');
    return;
  }

  console.log('\n=== Latest Signal ===');
  console.log('ID:', data.id);
  console.log('Symbol:', data.symbol);
  console.log('Signal:', data.signal);
  console.log('Entry Price:', data.entry_price, typeof data.entry_price);
  console.log('Stop Loss:', data.stop_loss, typeof data.stop_loss);
  console.log('Take Profit:', data.take_profit, typeof data.take_profit);
  console.log('Confidence:', data.confidence);
  console.log('Created:', data.created_at);

  // Calculate Risk/Reward
  const isBuy = data.signal === 'BUY' || data.signal === 'STRONG_BUY';
  let riskReward = null;

  if (data.entry_price && data.stop_loss && data.take_profit) {
    if (isBuy) {
      const risk = data.entry_price - data.stop_loss;
      const reward = data.take_profit - data.entry_price;
      riskReward = risk > 0 ? reward / risk : null;
    } else {
      const risk = data.stop_loss - data.entry_price;
      const reward = data.entry_price - data.take_profit;
      riskReward = risk > 0 ? reward / risk : null;
    }
  }

  console.log('\n=== Risk/Reward Calculation ===');
  console.log('Is Buy Signal?', isBuy);
  if (isBuy) {
    console.log('Risk:', data.entry_price - data.stop_loss);
    console.log('Reward:', data.take_profit - data.entry_price);
  } else {
    console.log('Risk:', data.stop_loss - data.entry_price);
    console.log('Reward:', data.entry_price - data.take_profit);
  }
  console.log('Risk/Reward:', riskReward ? `1:${riskReward.toFixed(2)}` : 'N/A');
}

checkLatestSignal();
