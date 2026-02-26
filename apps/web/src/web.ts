import dotenv from 'dotenv';
import Fastify from 'fastify';

dotenv.config();
const app = Fastify({ logger: true });
const port = Number(process.env.WEB_PORT ?? 3001);

app.get('/health', async () => ({ status: 'ok' }));
app.get('/', async () => ({
  name: 'Rental SaaS Web',
  modules: ['public-booking', 'admin']
}));

await app.listen({ host: '0.0.0.0', port });
