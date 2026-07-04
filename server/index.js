import dotenv from 'dotenv';
import { createApp } from './src/app.js';
import { pool } from './src/config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = createApp();

async function start() {
  try {
    await pool.query('SELECT 1'); // fail fast if DB is unreachable
    app.listen(PORT, () => {
      console.log(`🚀 HRMS API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Could not connect to PostgreSQL:', err.message);
    process.exit(1);
  }
}

start();
