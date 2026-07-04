import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Return DATE (OID 1082) columns as plain 'YYYY-MM-DD' strings instead of
// timezone-shifted JS Date objects. Keeps calendar markers on the correct day.
pg.types.setTypeParser(1082, (v) => v);

// Single shared connection pool for the whole app.
export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'hrms',
  max: 10,
});

// Thin helper so controllers stay clean: `const { rows } = await query(sql, params)`
export const query = (text, params) => pool.query(text, params);

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err);
});
