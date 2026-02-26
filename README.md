# Rental SaaS Starter (Node.js)

Konkretes Startprojekt für eine flexible Rental-SaaS mit:

- **B2C + B2B**
- **Multi-Tenant**
- **Multi-Currency**
- **PostgreSQL mit DB-seitigem Overlap-Schutz**
- **Container Deployment**

## Enthalten

- `apps/api` – Fastify API (v1 Endpoints + Demo-Context Endpoint)
- `apps/worker` – Worker-Prozess Skeleton
- `apps/web` – Web-Service Skeleton
- `db/migrations/0001_init.sql` – Schema mit Overlap-Schutz
- `db/seeds/0001_demo_seed.sql` – Demo-Daten
- `deploy/docker-compose.local-demo.yml` – lokale Demo mit Postgres + Redis
- `deploy/docker-compose.timmehosting.yml` – Stack für externes Postgres

## Lokale Demo starten (empfohlen)

```bash
docker compose -f deploy/docker-compose.local-demo.yml up --build
```

Danach:

- API Health: `http://localhost:3000/health`
- API DB Health: `http://localhost:3000/health/db`
- Demo Context: `http://localhost:3000/v1/demo/context`
- Buchungs-UI + Adminbereich (Demo): `http://localhost:3001/`


- In der UI kannst du links zwischen **Buchungsseite** und **Adminbereich** wechseln.
- Admin lädt KPIs, Fleet und Buchungen live über `/v1/admin/*` und `/v1/assets`.

### Beispiel-Call für Quote

```bash
curl -X POST http://localhost:3000/v1/quotes \
  -H 'Content-Type: application/json' \
  -d '{
    "tenant_id": "11111111-1111-1111-1111-111111111111",
    "pickup_location_id": "22222222-2222-2222-2222-222222222222",
    "pickup_at": "2026-03-01T10:00:00.000Z",
    "dropoff_at": "2026-03-03T10:00:00.000Z",
    "vehicle_class": "adventure"
  }'
```

## Für Timmehosting / externes Postgres

Nutze weiter `deploy/docker-compose.timmehosting.yml` und deine externe DB-URL (mit TLS in Produktion).


## In 1 Kommando zeigen (Docker Desktop)

Wenn Docker Desktop läuft, kannst du die Demo direkt mit einem Script starten:

```bash
./scripts/demo-local.sh
```

Das Script macht automatisch:

1. `docker compose up -d --build`
2. wartet auf API/Web Health-Endpunkte
3. ruft `GET /v1/demo/context` auf
4. erstellt eine Beispiel-Quote via `POST /v1/quotes`

### Demo stoppen

```bash
docker compose -f deploy/docker-compose.local-demo.yml down
```
