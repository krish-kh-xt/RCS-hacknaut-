// Starts Express and (if present) the silence worker. Shared by Part 1 and Part 2.
//
// Part 2 contract: src/workers/silenceWorker.js must export startSilenceWorker().
const app = require('./app');
const config = require('./config/env');
const { pool } = require('./config/db');

async function main() {
  try {
    await pool.query('select 1');
    console.log('[db] connected');
  } catch (err) {
    console.warn('[db] could not connect:', err.message);
  }

  app.listen(config.port, () => console.log(`[server] RCS backend on port ${config.port}`));

  try {
    const worker = require('./workers/silenceWorker');
    worker.startSilenceWorker();
    console.log('[worker] silence worker started');
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && String(err.message).split('\n')[0].includes('silenceWorker')) {
      console.log('[worker] silenceWorker.js not found yet, skipping');
    } else {
      throw err;
    }
  }
}

main();
