import { getRedisConnection } from './redis';
import { prisma } from './db';

export function getHourWindowString(date: Date = new Date()): string {
  // Format: YYYY-MM-DD-HH
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  return `${y}-${m}-${d}-${h}`;
}

export function getNextHourWindowDate(date: Date = new Date()): Date {
  const nextHour = new Date(date);
  nextHour.setUTCMinutes(0, 0, 0);
  nextHour.setUTCHours(nextHour.getUTCHours() + 1);
  return nextHour;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  nextWindowDate: Date;
}

export async function checkAndIncrementRateLimit(
  senderEmail: string,
  hourlyLimit: number
): Promise<RateLimitCheckResult> {
  const now = new Date();
  const windowStr = getHourWindowString(now);
  const redisKey = `ratelimit:${senderEmail}:${windowStr}`;
  const nextWindowDate = getNextHourWindowDate(now);

  const redis = await getRedisConnection();

  // Atomic increment in Redis
  const count = await redis.incr(redisKey);
  if (count === 1) {
    // Expire key after 2 hours (7200 seconds)
    await redis.expire(redisKey, 7200);
  }

  // Update DB counter asynchronously for relational persistence
  prisma.senderRateLimit
    .upsert({
      where: {
        senderEmail_hourWindow: {
          senderEmail,
          hourWindow: windowStr,
        },
      },
      update: {
        count,
      },
      create: {
        senderEmail,
        hourWindow: windowStr,
        count,
      },
    })
    .catch((err) => console.warn('[RateLimiter] DB sync warning:', err.message));

  if (count > hourlyLimit) {
    return {
      allowed: false,
      currentCount: count,
      limit: hourlyLimit,
      nextWindowDate,
    };
  }

  return {
    allowed: true,
    currentCount: count,
    limit: hourlyLimit,
    nextWindowDate,
  };
}
