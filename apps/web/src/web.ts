import dotenv from 'dotenv';
import Fastify from 'fastify';

dotenv.config();
const app = Fastify({ logger: true });
const port = Number(process.env.WEB_PORT ?? 3001);
const apiBaseUrl = process.env.API_URL ?? 'http://localhost:3000';

const page = `<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rental SaaS Pro Demo</title>
  <style>
    :root { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
    body { margin: 0; background: #0b1220; color: #e5e7eb; }
    .layout { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }
    .sidebar { background: linear-gradient(180deg,#111827,#0f172a); padding: 22px 16px; border-right: 1px solid #1f2937; }
    .brand { font-size: 18px; font-weight: 800; margin-bottom: 16px; }
    .sub { color: #94a3b8; font-size: 12px; margin-bottom: 20px; }
    .nav button { width: 100%; text-align: left; margin-bottom: 8px; border: 1px solid #1f2937; background: #0f172a; color: #cbd5e1; padding: 10px 12px; border-radius: 10px; cursor: pointer; }
    .nav button.active { background: #1d4ed8; color: white; border-color: #1d4ed8; }
    main { padding: 22px; }
    .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
    .topbar h1 { margin: 0; font-size: 24px; }
    .muted { color: #94a3b8; font-size: 13px; }
    .panel { background: #111827; border: 1px solid #1f2937; border-radius: 14px; padding: 18px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
    label { display: block; margin: 10px 0 6px; font-weight: 600; }
    input, select, button, textarea { width: 100%; border-radius: 10px; border: 1px solid #334155; background: #0b1220; color: #e5e7eb; padding: 10px; }
    button.primary { background: #2563eb; border-color: #2563eb; font-weight: 700; cursor: pointer; }
    button.primary:hover { background: #1e40af; }
    .card { background: #0f172a; border: 1px solid #1f2937; border-radius: 12px; padding: 14px; }
    .metric { font-size: 28px; font-weight: 800; margin-top: 8px; }
    pre { background: #0b1220; border: 1px dashed #334155; border-radius: 10px; padding: 10px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #1f2937; padding: 8px; text-align: left; }
    .hidden { display: none; }
    @media (max-width: 980px) {
      .layout { grid-template-columns: 1fr; }
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">Rental SaaS Pro</div>
      <div class="sub">Public Booking + Admin Console</div>
      <div class="nav">
        <button id="tab-booking" class="active" onclick="showTab('booking')">🚀 Buchungsseite</button>
        <button id="tab-admin" onclick="showTab('admin')">🛠️ Adminbereich</button>
      </div>
    </aside>

    <main>
      <div class="topbar">
        <h1 id="page-title">Public Booking</h1>
        <div class="muted">API: ${apiBaseUrl}</div>
      </div>

      <section id="booking-view" class="panel">
        <p class="muted">Professionelle Buchungsstrecke (Demo): Echtzeit-Angebot, Hold und Booking.</p>
        <div class="grid-2">
          <div>
            <label>Tenant ID</label>
            <input id="tenant_id" value="11111111-1111-1111-1111-111111111111" />

            <label>Pickup Location</label>
            <input id="pickup_location_id" value="22222222-2222-2222-2222-222222222222" />

            <label>Fahrzeugklasse</label>
            <select id="vehicle_class">
              <option value="adventure">Adventure</option>
              <option value="touring">Touring</option>
              <option value="roadster">Roadster</option>
            </select>

            <label>Abholung</label>
            <input id="pickup_at" type="datetime-local" />

            <label>Rückgabe</label>
            <input id="dropoff_at" type="datetime-local" />

            <div class="grid-3" style="margin-top:12px;">
              <button class="primary" onclick="runQuote()">1) Quote</button>
              <button class="primary" onclick="runHold()">2) Hold</button>
              <button class="primary" onclick="runBooking()">3) Booking</button>
            </div>
          </div>
          <div>
            <div class="card"><strong>Flow-State</strong><pre id="flow-state">Noch nichts ausgeführt.</pre></div>
            <div class="card" style="margin-top:12px;"><strong>API Antwort</strong><pre id="booking-result">-</pre></div>
          </div>
        </div>
      </section>

      <section id="admin-view" class="panel hidden">
        <p class="muted">Admin Dashboard: KPIs, Flotte, Buchungen, Operations-Übersicht.</p>
        <div class="grid-3" id="kpis">
          <div class="card"><div>Assets</div><div id="kpi-assets" class="metric">-</div></div>
          <div class="card"><div>Aktive Buchungen</div><div id="kpi-bookings" class="metric">-</div></div>
          <div class="card"><div>Umsatz (minor)</div><div id="kpi-revenue" class="metric">-</div></div>
        </div>

        <div class="grid-2" style="margin-top:14px;">
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>Fleet</strong>
              <button onclick="loadAssets()">Neu laden</button>
            </div>
            <table>
              <thead><tr><th>Plate</th><th>Klasse</th><th>Status</th><th>Standort</th></tr></thead>
              <tbody id="assets-table"></tbody>
            </table>
          </div>

          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>Bookings</strong>
              <button onclick="loadBookings()">Neu laden</button>
            </div>
            <table>
              <thead><tr><th>No</th><th>Status</th><th>Typ</th><th>Total</th></tr></thead>
              <tbody id="bookings-table"></tbody>
            </table>
          </div>
        </div>

        <div class="card" style="margin-top:14px;">
          <strong>Admin Event Log</strong>
          <pre id="admin-log">Ready.</pre>
        </div>
      </section>
    </main>
  </div>

  <script>
    let state = { quote_id: null, hold_id: null, booking_id: null };

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    document.getElementById('pickup_at').value = tomorrow.toISOString().slice(0,16);
    document.getElementById('dropoff_at').value = dayAfter.toISOString().slice(0,16);

    function tenantId() { return document.getElementById('tenant_id').value; }
    function flow() { document.getElementById('flow-state').textContent = JSON.stringify(state, null, 2); }
    function result(payload) { document.getElementById('booking-result').textContent = JSON.stringify(payload, null, 2); }
    function log(msg) { document.getElementById('admin-log').textContent = msg + '\n' + document.getElementById('admin-log').textContent; }

    function showTab(tab) {
      const booking = document.getElementById('booking-view');
      const admin = document.getElementById('admin-view');
      document.getElementById('tab-booking').classList.toggle('active', tab === 'booking');
      document.getElementById('tab-admin').classList.toggle('active', tab === 'admin');
      booking.classList.toggle('hidden', tab !== 'booking');
      admin.classList.toggle('hidden', tab !== 'admin');
      document.getElementById('page-title').textContent = tab === 'booking' ? 'Public Booking' : 'Admin Console';
      if (tab === 'admin') {
        loadOverview();
        loadAssets();
        loadBookings();
      }
    }

    async function runQuote() {
      const payload = {
        tenant_id: tenantId(),
        pickup_location_id: document.getElementById('pickup_location_id').value,
        vehicle_class: document.getElementById('vehicle_class').value,
        pickup_at: new Date(document.getElementById('pickup_at').value).toISOString(),
        dropoff_at: new Date(document.getElementById('dropoff_at').value).toISOString()
      };
      const res = await fetch('${apiBaseUrl}/v1/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      state.quote_id = data.quote_id ?? null;
      flow();
      result({ step: 'quote', status: res.status, data });
    }

    async function runHold() {
      if (!state.quote_id) return result({ error: 'Bitte zuerst Quote ausführen.' });
      const payload = { tenant_id: tenantId(), quote_id: state.quote_id, expires_in_seconds: 900 };
      const res = await fetch('${apiBaseUrl}/v1/holds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      state.hold_id = data.hold_id ?? null;
      flow();
      result({ step: 'hold', status: res.status, data });
    }

    async function runBooking() {
      if (!state.hold_id) return result({ error: 'Bitte zuerst Hold ausführen.' });
      const payload = { tenant_id: tenantId(), hold_id: state.hold_id, customer_type: 'b2c' };
      const res = await fetch('${apiBaseUrl}/v1/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      state.booking_id = data.booking_id ?? null;
      flow();
      result({ step: 'booking', status: res.status, data });
      log('Neue Demo-Buchung: ' + (data.booking_no ?? data.booking_id ?? 'unknown'));
    }

    async function loadOverview() {
      const res = await fetch('${apiBaseUrl}/v1/admin/overview?tenant_id=' + encodeURIComponent(tenantId()));
      const data = await res.json();
      document.getElementById('kpi-assets').textContent = data.assets_total ?? '-';
      document.getElementById('kpi-bookings').textContent = data.active_bookings_total ?? '-';
      document.getElementById('kpi-revenue').textContent = data.revenue_minor ?? '-';
      log('Overview aktualisiert');
    }

    async function loadAssets() {
      const res = await fetch('${apiBaseUrl}/v1/assets?tenant_id=' + encodeURIComponent(tenantId()));
      const data = await res.json();
      const tbody = document.getElementById('assets-table');
      tbody.innerHTML = (data.items ?? []).map(item =>
        '<tr><td>' + item.plate + '</td><td>' + item.vehicle_class + '</td><td>' + item.status + '</td><td>' + item.location_name + '</td></tr>'
      ).join('') || '<tr><td colspan="4">Keine Daten</td></tr>';
      log('Assets geladen');
    }

    async function loadBookings() {
      const res = await fetch('${apiBaseUrl}/v1/admin/bookings?tenant_id=' + encodeURIComponent(tenantId()));
      const data = await res.json();
      const tbody = document.getElementById('bookings-table');
      tbody.innerHTML = (data.items ?? []).map(item =>
        '<tr><td>' + item.booking_no + '</td><td>' + item.status + '</td><td>' + item.customer_type + '</td><td>' + item.total_amount_minor + ' ' + item.currency + '</td></tr>'
      ).join('') || '<tr><td colspan="4">Keine Daten</td></tr>';
      log('Bookings geladen');
    }

    flow();
  </script>
</body>
</html>`;

app.get('/health', async () => ({ status: 'ok' }));
app.get('/', async (_req, reply) => {
  reply.type('text/html').send(page);
});

await app.listen({ host: '0.0.0.0', port });
