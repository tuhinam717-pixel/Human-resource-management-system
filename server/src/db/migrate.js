// Runs schema.sql against the configured database.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from '../config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  try {
    await pool.query(sql);
    console.log('✅ Schema created successfully.');
  } catch (err) {
    // Log the full error — connection failures (e.g. AggregateError) often have
    // an empty .message, so print code + the whole error to reveal the cause.
    console.error('❌ Migration failed:', err.message || '(no message)');
    if (err.code) console.error('   code:', err.code);
    if (err.errors) console.error('   causes:', err.errors.map((e) => e.message || e.code).join('; '));
    console.error(err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
