# Supabase Setup Guide

This guide explains how to set up the automatic **daily cache cleanup** (24h reset) for your Aurum database.

## 1. Execute the Schema

First, execute the complete schema in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `schema.sql`
4. Click **Run**

This will create:
- The `candles` table
- RLS policies for security
- The `cleanup_old_candles()` function

## 2. Enable pg_cron Extension

To enable automatic daily cleanup, you need to activate the pg_cron extension:

1. Go to **Database** > **Extensions** in your Supabase Dashboard
2. Search for `pg_cron`
3. Click **Enable** on the pg_cron extension

## 3. Schedule Automatic Cleanup (Recommended)

Once pg_cron is enabled, schedule the cleanup to run daily at midnight (00:00):

```sql
-- Run this in SQL Editor
SELECT cron.schedule(
  'cleanup-old-candles-midnight',
  '0 0 * * *',  -- Midnight UTC (adjust for your timezone)
  'SELECT cleanup_old_candles()'
);
```

**Important**: The time is in UTC. Adjust for your timezone:
- **Spain (CET/CEST)**: `'0 23 * * *'` (23:00 UTC = 00:00 CET in winter)
- **Mexico City (CST)**: `'0 6 * * *'` (06:00 UTC = 00:00 CST)
- **New York (EST)**: `'0 5 * * *'` (05:00 UTC = 00:00 EST)

### Verify Scheduled Job

The `cron.schedule()` command returns a number (the job ID). If you got a number like `7`, it means the job was created successfully!

To check if the job is scheduled correctly:

```sql
SELECT * FROM cron.job;
```

You should see an entry for `cleanup-old-candles-midnight` with details like:
- `jobid`: The number returned (e.g., 7)
- `schedule`: `0 0 * * *`
- `command`: `SELECT cleanup_old_candles()`
- `active`: `t` (true)

### View Job History

To see execution history and logs:

```sql
SELECT * FROM cron.job_run_details
WHERE jobname = 'cleanup-old-candles-midnight'
ORDER BY start_time DESC
LIMIT 10;
```

## 4. Manual Cleanup (Alternative)

If you prefer manual cleanup or can't use pg_cron (free tier limitation), you can:

### Option A: Run manually in SQL Editor

```sql
SELECT cleanup_old_candles();
```

This returns the number of deleted rows.

### Option B: Call from your backend script

If you have a backend script (Node.js/Deno), you can add this to run periodically:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Important: use service_role, not anon
);

// Run cleanup
async function cleanupCache() {
  const { data, error } = await supabase.rpc('cleanup_old_candles');

  if (error) {
    console.error('Cleanup failed:', error);
  } else {
    console.log(`Cleanup successful: deleted ${data} candles`);
  }
}

// Run every 24 hours
setInterval(cleanupCache, 24 * 60 * 60 * 1000);
```

## 5. Unscheduling (if needed)

To remove the scheduled job:

```sql
SELECT cron.unschedule('cleanup-old-candles-midnight');
```

## Cache Configuration Summary

- **Retention period**: 24 hours (1 day)
- **Fresh threshold**: 1 hour (data older than this triggers API fetch)
- **Cleanup frequency**: Daily at 00:00 midnight (if using pg_cron)
- **Storage impact**: DB will stay ~1-2 MB, never grow beyond that
- **Candle interval**: 1h (configurable in frontend)
- **Typical data**: ~100 candles = 4 days of 1h data

## Monitoring

To check how many candles you currently have:

```sql
SELECT
  symbol,
  interval,
  COUNT(*) as candle_count,
  MIN(to_timestamp(open_time / 1000)) as oldest,
  MAX(to_timestamp(open_time / 1000)) as newest
FROM candles
GROUP BY symbol, interval
ORDER BY symbol, interval;
```

To check total DB size:

```sql
SELECT
  pg_size_pretty(pg_total_relation_size('candles')) as table_size;
```

## Troubleshooting

### pg_cron not available
- pg_cron is available on all Supabase plans, including the free tier
- Make sure you enabled it in Database > Extensions

### Cleanup not running
1. Check if the job is scheduled: `SELECT * FROM cron.job;`
2. Check execution logs: `SELECT * FROM cron.job_run_details;`
3. Verify the function exists: `\df cleanup_old_candles` in psql

### Permission errors
- The cleanup function uses `SECURITY DEFINER`, which runs with the privileges of the function creator
- Make sure you created the function while connected with appropriate permissions

## Questions?

If you encounter issues, check:
- Supabase logs in Dashboard > Logs
- PostgreSQL error messages in the SQL Editor
- Your service_role key is correct (for backend operations)