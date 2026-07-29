import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

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