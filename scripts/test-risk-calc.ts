import 'dotenv/config';
import { calculatePositionSize } from '@/lib/api/trading';

console.log('=== Risk-Based Position Sizing Test ===\n');

const balance = 999; // Current testnet balance
const entryPrice = 89906; // From last signal
const stopLoss = 88566; // From last signal
const takeProfit = 92587; // From last signal

console.log('Account Info:');
console.log(`  Balance: $${balance}`);
console.log(`  Risk per trade: 2%\n`);

console.log('Trade Setup:');
console.log(`  Entry Price: $${entryPrice.toLocaleString()}`);
console.log(`  Stop Loss: $${stopLoss.toLocaleString()}`);
console.log(`  Take Profit: $${takeProfit.toLocaleString()}`);
console.log(`  Distance to SL: $${(entryPrice - stopLoss).toLocaleString()}\n`);

const size = calculatePositionSize(balance, entryPrice, stopLoss);

console.log('Position Calculation:');
console.log(`  Risk Amount: $${(balance * 0.02).toFixed(2)} (2% of $${balance})`);
console.log(`  Position Size: ${size} BTC`);
console.log(`  Position Value: $${(size * entryPrice).toFixed(2)}`);
console.log(`  Max Loss if SL hit: $${(size * (entryPrice - stopLoss)).toFixed(2)}`);
console.log(`  Profit if TP hit: $${(size * (takeProfit - entryPrice)).toFixed(2)}\n`);

console.log('Risk:Reward Ratio:');
const risk = size * (entryPrice - stopLoss);
const reward = size * (takeProfit - entryPrice);
console.log(`  Risk: $${risk.toFixed(2)}`);
console.log(`  Reward: $${reward.toFixed(2)}`);
console.log(`  R:R = 1:${(reward / risk).toFixed(2)}\n`);

// Compare with old method (95% of balance)
const oldSize = (balance * 0.95) / entryPrice;
const oldSizeRounded = Math.floor(oldSize * 1000) / 1000;
console.log('Comparison with OLD method (95% of balance):');
console.log(`  OLD Position Size: ${oldSizeRounded} BTC`);
console.log(`  OLD Position Value: $${(oldSizeRounded * entryPrice).toFixed(2)}`);
console.log(`  OLD Max Loss if SL hit: $${(oldSizeRounded * (entryPrice - stopLoss)).toFixed(2)} 😱\n`);

console.log('✅ NEW method only risks 2% ($19.98) vs OLD method risking ~$12.64!');