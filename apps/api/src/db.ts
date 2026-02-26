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

export async function listAssets(tenantId: string) {
  const result = await pool.query(
    `
      select a.id, a.plate, a.vehicle_class, a.status, l.name as location_name
      from asset a
      join location l on l.id = a.location_id
      where a.tenant_id = $1
      order by a.created_at desc
    `,
    [tenantId]
  );
  return result.rows;
}

export async function listBookings(tenantId: string) {
  const result = await pool.query(
    `
      select
        b.id,
        b.booking_no,
        b.customer_type,
        b.status,
        b.pickup_at,
        b.dropoff_at,
        b.total_amount_minor,
        b.currency,
        pickup.name as pickup_location,
        dropoff.name as dropoff_location
      from booking b
      join location pickup on pickup.id = b.pickup_location_id
      left join location dropoff on dropoff.id = b.dropoff_location_id
      where b.tenant_id = $1
      order by b.created_at desc
      limit 50
    `,
    [tenantId]
  );
  return result.rows;
}

export async function getAdminOverview(tenantId: string) {
  const [assets, bookings, revenue] = await Promise.all([
    pool.query('select count(*)::int as total from asset where tenant_id = $1', [tenantId]),
    pool.query("select count(*)::int as total from booking where tenant_id = $1 and status in ('held','confirmed','checked_out','returned')", [tenantId]),
    pool.query("select coalesce(sum(total_amount_minor), 0)::bigint as total from booking where tenant_id = $1 and status in ('confirmed','checked_out','returned')", [tenantId])
  ]);

  return {
    assets_total: assets.rows[0]?.total ?? 0,
    active_bookings_total: bookings.rows[0]?.total ?? 0,
    revenue_minor: Number(revenue.rows[0]?.total ?? 0)
  };
}
