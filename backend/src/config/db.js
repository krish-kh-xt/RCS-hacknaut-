// pg connection pool. Shared by Part 1 and Part 2.
const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  connectionString: config.databaseUrl,
  // Supabase needs SSL; local Postgres does not.
  ssl: config.databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => console.error('[db] unexpected pool error:', err.message));

module.exports = { pool, query: (text, params) => pool.query(text, params) };
