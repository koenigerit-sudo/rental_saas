import dotenv from 'dotenv';

dotenv.config();

const intervalMs = 5000;

setInterval(() => {
  console.log(`[worker] heartbeat ${new Date().toISOString()}`);
}, intervalMs);

console.log('[worker] started');
