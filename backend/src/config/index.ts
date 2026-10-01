import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  redisUrl: process.env.REDIS_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'reachinbox_default_secret_key',
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  defaultMinDelayMs: parseInt(process.env.DEFAULT_MIN_DELAY_MS || '2000', 10),
  defaultHourlyLimit: parseInt(process.env.DEFAULT_HOURLY_LIMIT || '200', 10),
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  slackClientId: process.env.SLACK_CLIENT_ID || '',
  slackClientSecret: process.env.SLACK_CLIENT_SECRET || '',
  slackRedirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:5001/api/slack/callback',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
