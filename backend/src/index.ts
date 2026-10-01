import { createApp } from './app';
import { config } from './config';
import { getRedisConnection } from './services/redis';
import { getTransporter } from './services/smtp';
import { startEmailWorker, recoverScheduledJobsOnStartup } from './queue/emailQueue';

async function bootstrap() {
  console.log('--------------------------------------------------');
  console.log('🚀 Starting ReachInbox Email Scheduler Service...');
  console.log('--------------------------------------------------');

  try {
    // 1. Initialize Redis
    await getRedisConnection();

    // 2. Initialize SMTP (Ethereal test account)
    await getTransporter();

    // 3. Initialize BullMQ Worker
    startEmailWorker();

    // 4. Recover persisted scheduled jobs on startup
    await recoverScheduledJobsOnStartup();

    // 5. Start Express App
    const app = createApp();
    app.listen(config.port, () => {
      console.log(`\n✅ Backend running at: http://localhost:${config.port}`);
      console.log(`📊 BullMQ Live Dashboard: http://localhost:${config.port}/admin/queues`);
      console.log(`🔌 Health check: http://localhost:${config.port}/health\n`);
    });
  } catch (err: any) {
    console.error('❌ Failed to bootstrap backend service:', err);
    process.exit(1);
  }
}

bootstrap();
