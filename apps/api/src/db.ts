import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL
});

export async function dbHealthcheck() {
  const result = await pool.query('select 1 as ok');
  return result.rows[0]?.ok === 1;
}

export async function getDemoContext() {
  const sql = `
    select
      t.id as tenant_id,
      t.name as tenant_name,
      l.id as location_id,
      l.name as location_name,
      a.id as asset_id,
      a.plate as asset_plate,
      a.vehicle_class
    from tenant t
    join location l on l.tenant_id = t.id
    join asset a on a.location_id = l.id and a.tenant_id = t.id
    where t.id = '11111111-1111-1111-1111-111111111111'
    limit 1
  `;

  const result = await pool.query(sql);
  return result.rows[0] ?? null;
}
