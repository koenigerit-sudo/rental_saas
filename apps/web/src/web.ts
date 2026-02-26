import dotenv from 'dotenv';
import Fastify from 'fastify';

dotenv.config();
const app = Fastify({ logger: true });
const port = Number(process.env.WEB_PORT ?? 3001);
const apiBaseUrl = process.env.API_URL ?? 'http://localhost:3000';

const bookingPage = `<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rental SaaS Demo Booking</title>
  <style>
    :root { font-family: Inter, system-ui, Arial, sans-serif; color-scheme: light; }
    body { margin: 0; background: #f5f7fb; color: #1f2937; }
    .container { max-width: 980px; margin: 32px auto; padding: 0 16px; }
    .hero { background: #111827; color: #fff; border-radius: 14px; padding: 22px; margin-bottom: 20px; }
    .hero h1 { margin: 0 0 8px; font-size: 28px; }
    .grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; }
    .card { background: #fff; border-radius: 12px; padding: 18px; box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08); }
    label { display: block; font-weight: 600; margin: 10px 0 6px; }
    input, select, button { width: 100%; border-radius: 8px; border: 1px solid #d1d5db; padding: 10px; font-size: 14px; }
    button { border: none; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; margin-top: 14px; }
    button:hover { background: #1d4ed8; }
    .muted { color: #6b7280; font-size: 13px; }
    .result { white-space: pre-wrap; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px; min-height: 110px; }
    .pill { display: inline-block; padding: 4px 8px; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; }
    @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="container">
    <section class="hero">
      <h1>Rental SaaS – Buchungsdemo</h1>
      <p class="muted">API verbunden mit <strong>${apiBaseUrl}</strong>. Diese Seite zeigt den Public-Booking-Flow (Quote) mit Live-Call an die API.</p>
      <span class="pill">Demo UI aktiv</span>
    </section>

    <section class="grid">
      <article class="card">
        <h2>Jetzt Angebot berechnen</h2>
        <form id="quote-form">
          <label for="tenant_id">Tenant ID</label>
          <input id="tenant_id" value="11111111-1111-1111-1111-111111111111" required />

          <label for="pickup_location_id">Pickup Location ID</label>
          <input id="pickup_location_id" value="22222222-2222-2222-2222-222222222222" required />

          <label for="vehicle_class">Fahrzeugklasse</label>
          <select id="vehicle_class">
            <option value="adventure">Adventure</option>
            <option value="touring">Touring</option>
            <option value="roadster">Roadster</option>
          </select>

          <label for="pickup_at">Abholung</label>
          <input id="pickup_at" type="datetime-local" required />

          <label for="dropoff_at">Rückgabe</label>
          <input id="dropoff_at" type="datetime-local" required />

          <button type="submit">Quote anfragen</button>
        </form>
      </article>

      <article class="card">
        <h2>Antwort</h2>
        <p class="muted">Bei Erfolg siehst du Quote-ID und Preis. Bei Fehlern wird die API-Response angezeigt.</p>
        <div id="result" class="result">Noch keine Anfrage gesendet.</div>
      </article>
    </section>
  </main>

  <script>
    const pickupField = document.getElementById('pickup_at');
    const dropoffField = document.getElementById('dropoff_at');
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    pickupField.value = tomorrow.toISOString().slice(0, 16);
    dropoffField.value = dayAfter.toISOString().slice(0, 16);

    document.getElementById('quote-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const result = document.getElementById('result');
      result.textContent = 'Lade...';

      const payload = {
        tenant_id: document.getElementById('tenant_id').value,
        pickup_location_id: document.getElementById('pickup_location_id').value,
        vehicle_class: document.getElementById('vehicle_class').value,
        pickup_at: new Date(document.getElementById('pickup_at').value).toISOString(),
        dropoff_at: new Date(document.getElementById('dropoff_at').value).toISOString()
      };

      try {
        const response = await fetch('${apiBaseUrl}/v1/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        result.textContent = JSON.stringify({ status: response.status, data }, null, 2);
      } catch (error) {
        result.textContent = 'Fehler beim API-Call: ' + error.message;
      }
    });
  </script>
</body>
</html>`;

app.get('/health', async () => ({ status: 'ok' }));
app.get('/', async (_req, reply) => {
  reply.type('text/html').send(bookingPage);
});

await app.listen({ host: '0.0.0.0', port });
