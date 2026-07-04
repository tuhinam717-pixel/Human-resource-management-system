import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Return DATE (OID 1082) columns as plain 'YYYY-MM-DD' strings instead of
// timezone-shifted JS Date objects. Keeps calendar markers on the correct day.
pg.types.setTypeParser(1082, (v) => v);

// Enable SSL for hosted databases (Neon/Render/Heroku/Supabase). Their certs are
// not in Node's trust store, so we disable strict verification. Any DATABASE_URL
// is assumed to be a hosted DB that needs SSL; locally (PG* vars) it stays off
// unless explicitly forced via PGSSL=true.
const useSSL =
  !!process.env.DATABASE_URL ||
  process.env.PGSSL === 'true' ||
  process.env.NODE_ENV === 'production';
const ssl = useSSL ? { rejectUnauthorized: false } : false;

// Prefer a single DATABASE_URL connection string (how Render/Heroku expose Postgres);
// otherwise fall back to individual PG* vars for local development.
export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl, max: 10 })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'hrms',
      ssl,
      max: 10,
    });

// Thin helper so controllers stay clean: `const { rows } = await query(sql, params)`
export const query = (text, params) => pool.query(text, params);

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err);
});
