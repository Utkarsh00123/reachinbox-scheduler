import Redis, { RedisOptions } from 'ioredis';
import { config } from '../config';

let redisInstance: Redis | null = null;
let redisConnectionOptions: RedisOptions = {
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null,
};

export function getRedisOptions(): RedisOptions {
  if (config.redisUrl) {
    return {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  }
  return redisConnectionOptions;
}

export async function getRedisConnection(): Promise<Redis> {
  if (redisInstance) {
    return redisInstance;
  }

  if (config.redisUrl) {
    console.log(`[Redis] Connecting to external Redis at ${config.redisUrl}...`);
    redisInstance = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  } else {
    console.log('[Redis] Connecting to Redis on 127.0.0.1:6379...');
    redisInstance = new Redis({
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        const delay = Math.min(times * 1000, 3000);
        return delay;
      },
    });
  }

  redisInstance.on('connect', () => {
    console.log('✅ [Redis] Successfully connected to Redis.');
  });

  redisInstance.on('error', (err) => {
    console.warn('⚠️ [Redis] Connection warning/error:', err.message);
  });

  return redisInstance;
}

export async function closeRedis() {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}
