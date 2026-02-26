-- 0001_init.sql
-- Initial schema for multi-tenant rental SaaS

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE tenant (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  default_currency char(3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_user (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE location (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  name text NOT NULL,
  timezone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE asset (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
  vin text,
  plate text,
  vehicle_class text NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'maintenance', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, plate)
);

CREATE TABLE maintenance_block (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES asset(id) ON DELETE CASCADE,
  period tstzrange NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE corporate_account (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  billing_email text NOT NULL,
  payment_terms_days integer NOT NULL DEFAULT 14,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE booking (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  booking_no text NOT NULL,
  customer_type text NOT NULL CHECK (customer_type IN ('b2c','b2b')),
  corporate_account_id uuid REFERENCES corporate_account(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('quote','held','confirmed','checked_out','returned','cancelled','no_show')),
  pickup_location_id uuid NOT NULL REFERENCES location(id),
  dropoff_location_id uuid REFERENCES location(id),
  pickup_at timestamptz NOT NULL,
  dropoff_at timestamptz NOT NULL,
  total_amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, booking_no)
);

CREATE TABLE booking_item (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES asset(id) ON DELETE RESTRICT,
  period tstzrange NOT NULL,
  status text NOT NULL CHECK (status IN ('held','confirmed','checked_out','returned','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Hard protection against double booking per asset
ALTER TABLE booking_item
  ADD CONSTRAINT booking_item_no_overlap_per_asset
  EXCLUDE USING gist (
    tenant_id WITH =,
    asset_id WITH =,
    period WITH &&
  )
  WHERE (status IN ('held', 'confirmed', 'checked_out'));

CREATE TABLE payment (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  provider text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('deposit','full','preauth','capture','refund')),
  status text NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_event (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_tenant_location ON asset(tenant_id, location_id);
CREATE INDEX idx_booking_tenant_status ON booking(tenant_id, status);
CREATE INDEX idx_booking_item_tenant_asset ON booking_item(tenant_id, asset_id);
CREATE INDEX idx_payment_tenant_booking ON payment(tenant_id, booking_id);
CREATE INDEX idx_audit_event_tenant_aggregate ON audit_event(tenant_id, aggregate_type, aggregate_id);
