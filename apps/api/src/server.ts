import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { env } from './env.js';
import { dbHealthcheck, getAdminOverview, getDemoContext, listAssets, listBookings } from './db.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const MoneySchema = z.object({ amount_minor: z.number().int(), currency: z.string().length(3) });
const TenantQuery = z.object({ tenant_id: z.string().uuid() });

const QuoteRequest = z.object({
  tenant_id: z.string().uuid(),
  pickup_location_id: z.string().uuid(),
  dropoff_location_id: z.string().uuid().optional(),
  pickup_at: z.string().datetime(),
  dropoff_at: z.string().datetime(),
  vehicle_class: z.string().min(1).optional()
});

app.get('/health', async () => ({ status: 'ok' }));

app.get('/health/db', async (_req, reply) => {
  try {
    const ok = await dbHealthcheck();
    return { status: ok ? 'ok' : 'degraded' };
  } catch {
    return reply.code(503).send({ status: 'down' });
  }
});

app.post('/v1/quotes', async (req, reply) => {
  const parsed = QuoteRequest.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send(parsed.error.flatten());

  const start = new Date(parsed.data.pickup_at).getTime();
  const end = new Date(parsed.data.dropoff_at).getTime();
  const days = Math.max(1, Math.ceil((end - start) / 86_400_000));

  const classMultiplier = parsed.data.vehicle_class === 'touring' ? 1.2 : parsed.data.vehicle_class === 'roadster' ? 1.1 : 1;
  const baseDaily = 9900;
  const amountMinor = Math.round(days * baseDaily * classMultiplier);

  return {
    quote_id: randomUUID(),
    total: MoneySchema.parse({ amount_minor: amountMinor, currency: 'EUR' }),
    meta: { days, pricing_model: 'daily_dynamic_v2', vehicle_class: parsed.data.vehicle_class ?? 'adventure' }
  };
});

const HoldRequest = z.object({ tenant_id: z.string().uuid(), quote_id: z.string().uuid(), expires_in_seconds: z.number().int().min(60).max(3600) });
app.post('/v1/holds', async (req, reply) => {
  const parsed = HoldRequest.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send(parsed.error.flatten());

  return reply.code(201).send({
    hold_id: randomUUID(),
    expires_at: new Date(Date.now() + parsed.data.expires_in_seconds * 1000).toISOString()
  });
});

const CreateBooking = z.object({
  tenant_id: z.string().uuid(),
  hold_id: z.string().uuid(),
  customer_type: z.enum(['b2c', 'b2b']),
  corporate_account_id: z.string().uuid().optional()
});

app.post('/v1/bookings', async (req, reply) => {
  const parsed = CreateBooking.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send(parsed.error.flatten());

  return reply.code(201).send({
    booking_id: randomUUID(),
    booking_no: `BK-${Date.now()}`,
    status: 'confirmed',
    customer_type: parsed.data.customer_type
  });
});

app.get('/v1/bookings/:id', async (req, reply) => {
  const id = z.string().uuid().safeParse((req.params as { id: string }).id);
  if (!id.success) return reply.code(400).send({ message: 'Invalid booking id' });

  return {
    booking_id: id.data,
    status: 'confirmed'
  };
});

const PaymentIntent = z.object({ tenant_id: z.string().uuid(), booking_id: z.string().uuid(), mode: z.enum(['deposit', 'full', 'preauth']) });
app.post('/v1/payments/intents', async (req, reply) => {
  const parsed = PaymentIntent.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send(parsed.error.flatten());

  return reply.code(201).send({
    provider: 'stripe',
    mode: parsed.data.mode,
    client_secret: `pi_${randomUUID()}_secret_${randomUUID()}`
  });
});

app.post('/v1/webhooks/stripe', async (req) => ({ received: true, type: (req.body as { type?: string })?.type ?? 'unknown' }));

app.get('/v1/demo/context', async (_req, reply) => {
  try {
    const context = await getDemoContext();
    if (!context) return reply.code(404).send({ message: 'Demo seed data not found' });

    return {
      tenant: {
        id: context.tenant_id,
        name: context.tenant_name
      },
      location: {
        id: context.location_id,
        name: context.location_name
      },
      asset: {
        id: context.asset_id,
        plate: context.asset_plate,
        vehicle_class: context.vehicle_class
      }
    };
  } catch {
    return reply.code(503).send({ message: 'Database unavailable' });
  }
});

app.get('/v1/assets', async (req, reply) => {
  const parsed = TenantQuery.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
  try {
    return { items: await listAssets(parsed.data.tenant_id) };
  } catch {
    return reply.code(503).send({ message: 'Database unavailable' });
  }
});

app.get('/v1/admin/bookings', async (req, reply) => {
  const parsed = TenantQuery.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
  try {
    return { items: await listBookings(parsed.data.tenant_id) };
  } catch {
    return reply.code(503).send({ message: 'Database unavailable' });
  }
});

app.get('/v1/admin/overview', async (req, reply) => {
  const parsed = TenantQuery.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
  try {
    return await getAdminOverview(parsed.data.tenant_id);
  } catch {
    return reply.code(503).send({ message: 'Database unavailable' });
  }
});

const closeSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
closeSignals.forEach((signal) => {
  process.on(signal, async () => {
    await app.close();
    process.exit(0);
  });
});

app.listen({ port: env.PORT, host: '0.0.0.0' })
  .then(() => app.log.info(`API listening on ${env.PORT}`))
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
