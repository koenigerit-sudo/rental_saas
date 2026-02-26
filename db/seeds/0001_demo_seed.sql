-- Demo seed data (idempotent style)

INSERT INTO tenant (id, name, default_currency)
SELECT '11111111-1111-1111-1111-111111111111', 'Demo Rentals', 'EUR'
WHERE NOT EXISTS (
  SELECT 1 FROM tenant WHERE id = '11111111-1111-1111-1111-111111111111'
);

INSERT INTO location (id, tenant_id, name, timezone)
SELECT
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'München Zentrale',
  'Europe/Berlin'
WHERE NOT EXISTS (
  SELECT 1 FROM location WHERE id = '22222222-2222-2222-2222-222222222222'
);

INSERT INTO asset (id, tenant_id, location_id, vin, plate, vehicle_class, status)
SELECT
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'WBADEMO000001',
  'M-DEMO-100',
  'adventure',
  'available'
WHERE NOT EXISTS (
  SELECT 1 FROM asset WHERE id = '33333333-3333-3333-3333-333333333333'
);

INSERT INTO asset (id, tenant_id, location_id, vin, plate, vehicle_class, status)
SELECT
  '33333333-3333-3333-3333-333333333334',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'WBADEMO000002',
  'M-DEMO-200',
  'touring',
  'available'
WHERE NOT EXISTS (
  SELECT 1 FROM asset WHERE id = '33333333-3333-3333-3333-333333333334'
);

INSERT INTO booking (
  id, tenant_id, booking_no, customer_type, status,
  pickup_location_id, dropoff_location_id, pickup_at, dropoff_at,
  total_amount_minor, currency
)
SELECT
  '44444444-4444-4444-4444-444444444441',
  '11111111-1111-1111-1111-111111111111',
  'BK-DEMO-0001',
  'b2c',
  'confirmed',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  now() + interval '1 day',
  now() + interval '3 days',
  19800,
  'EUR'
WHERE NOT EXISTS (
  SELECT 1 FROM booking WHERE id = '44444444-4444-4444-4444-444444444441'
);

INSERT INTO booking_item (id, tenant_id, booking_id, asset_id, period, status)
SELECT
  '55555555-5555-5555-5555-555555555551',
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444441',
  '33333333-3333-3333-3333-333333333333',
  tstzrange(now() + interval '1 day', now() + interval '3 days', '[)'),
  'confirmed'
WHERE NOT EXISTS (
  SELECT 1 FROM booking_item WHERE id = '55555555-5555-5555-5555-555555555551'
);
