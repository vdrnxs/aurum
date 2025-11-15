# Database Schema

This folder contains the SQL schema for the Supabase database.

## Files

- `schema.sql` - Complete database schema with RLS policies

## Usage

Execute `schema.sql` in Supabase SQL Editor:

1. Go to your Supabase project
2. Open SQL Editor
3. Copy and paste the content of `schema.sql`
4. Run the query

## Reset Database

If you need to reset the database, add this at the beginning of `schema.sql`:

```sql
DROP POLICY IF EXISTS "Allow public read access" ON candles;
DROP POLICY IF EXISTS "Allow service role insert" ON candles;
DROP POLICY IF EXISTS "Allow service role update" ON candles;
DROP POLICY IF EXISTS "Allow service role delete" ON candles;
DROP TABLE IF EXISTS candles CASCADE;
```
