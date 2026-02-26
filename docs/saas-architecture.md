# SaaS Architecture (B2C + B2B, Multi-Currency, Node.js)

## 1) Kernprinzipien

1. **Config > Code**: Pricing, Policies, One-Way, Eligibility als konfigurierbare Rulesets.
2. **DB-first Konsistenz**: Keine Doppelbuchung durch DB-Constraint (nicht nur App-Checks).
3. **Modularer Monolith als Start**: Schnell lieferbar, später gezielte Entkopplung.
4. **Stateless App-Container**: PostgreSQL extern, Container austauschbar.

## 2) Laufzeit-Module

- **API**: Booking, Fleet, Payments, B2B Accounts, Webhooks.
- **Worker**: E-Mail/SMS, PDF, Reminder, Retry-Logik.
- **Web Public**: Buchungsstrecke / Widget.
- **Web Admin**: Kalender, Fleet Ops, Policies, Rechnungen.

## 3) Datenmodell (vereinfacht)

- `tenant` + `app_user` + `role_assignment`
- `location`
- `asset` (eindeutiges Fahrzeug)
- `maintenance_block` (Sperrzeiten)
- `booking` + `booking_item` (asset + time range)
- `payment` (deposit/full/refund/preauth)
- `corporate_account` (B2B)
- `audit_event` (immutable)

## 4) Real-Time Booking & Double-Booking-Schutz

Für `booking_item` wird ein `tstzrange` pro Asset gespeichert.
Ein Postgres `EXCLUDE USING gist` Constraint verhindert überlappende aktive Buchungen.

Dadurch sind Race Conditions bei parallelen Checkouts atomar abgesichert.

## 5) Multi-Tenant Isolation

- Pflichtfeld `tenant_id` auf allen Business-Tabellen
- Alle API-Queries immer mit `tenant_id` Scope
- Optional später: Postgres RLS als zweite Schutzschicht

## 6) Payments

- Modus: `deposit`, `full`, `refund`, `preauth`, `capture`
- Kaution (Pre-Auth) optional pro Tenant/Rate Plan
- Webhook-Events idempotent verarbeiten

## 7) Deployment (Timmehosting-orientiert)

- App-Container auf dem vServer
- PostgreSQL extern angebunden
- Redis lokal oder managed
- Optional PgBouncer für Connection Pooling

## 8) Security Baseline

- TLS zur DB erzwingen (`sslmode=require`)
- Signierte Webhooks
- Idempotency-Key bei Checkout/Payment
- Rate Limiting
- Audit Trail für alle kritischen Zustandswechsel
