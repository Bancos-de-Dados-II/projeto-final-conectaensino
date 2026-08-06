import { createClient } from 'redis';

function normalizeRedisUrl(value?: string): string {
  const raw = value?.trim();
  if (!raw) return 'redis://localhost:6379';
  if (/^rediss?:\/\//i.test(raw)) return raw;

  // O console do Upstash também fornece credenciais como senha@host:porta.
  if (raw.includes('@')) return `rediss://default:${raw}`;

  return `redis://${raw}`;
}

const redisUrl = normalizeRedisUrl(process.env.REDIS_URL);

const redisClient = createClient({
  url: redisUrl,
  socket: {
    tls: redisUrl.startsWith('rediss://') ? true : undefined,
    rejectUnauthorized: false
  }
});

redisClient.on('error', (err) => console.error('🔴 Erro no Redis:', err));
redisClient.on('connect', () => console.log('🟢 Conectado ao Upstash Redis com sucesso!'));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export default redisClient;
