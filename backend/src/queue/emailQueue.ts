import { Queue, Worker, Job } from 'bullmq';
import { getRedisOptions } from '../services/redis';
import { prisma } from '../services/db';
import { sendEmail } from '../services/smtp';
import { checkAndIncrementRateLimit } from '../services/rateLimiter';
import { notifyRateLimitHit } from '../services/slack';
import { indexEmail } from '../services/elasticsearch';
import { config } from '../config';

export const EMAIL_QUEUE_NAME = 'email-queue';

export interface EmailJobData {
  emailScheduleId: string;
  userId: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  body: string;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
}

let emailQueue: Queue<EmailJobData> | null = null;
let emailWorker: Worker<EmailJobData> | null = null;

export function getEmailQueue(): Queue<EmailJobData> {
  if (!emailQueue) {
    const redisOpts = getRedisOptions();
    emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
      connection: redisOpts,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 2000,
      },
    });
  }
  return emailQueue;
}

export async function scheduleEmailJob(
  data: EmailJobData,
  scheduledAt: Date
): Promise<string> {
  const queue = getEmailQueue();
  const now = Date.now();
  const delayMs = Math.max(0, new Date(scheduledAt).getTime() - now);

  const job = await queue.add('send-email', data, {
    delay: delayMs,
    jobId: data.emailScheduleId, // Idempotency: prevents duplicate queueing for same schedule record
  });

  return job.id as string;
}

export function startEmailWorker() {
  if (emailWorker) {
    return emailWorker;
  }

  const redisOpts = getRedisOptions();
  console.log(
    `[Worker] Initializing BullMQ Worker (Concurrency: ${config.workerConcurrency})...`
  );

  emailWorker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const {
        emailScheduleId,
        userId,
        senderEmail,
        recipient,
        subject,
        body,
        delayBetweenEmailsMs,
        hourlyLimit,
      } = job.data;

      console.log(
        `[Worker] Processing Job ${job.id} for ${recipient} (Sender: ${senderEmail})`
      );

      // Check if email already sent (Idempotency safeguard)
      const existing = await prisma.emailSchedule.findUnique({
        where: { id: emailScheduleId },
      });

      if (!existing || existing.status === 'SENT') {
        console.log(`[Worker] Email ${emailScheduleId} is already marked as SENT or deleted. Skipping.`);
        return;
      }

      // Check Hourly Rate Limit
      const rateLimitCheck = await checkAndIncrementRateLimit(senderEmail, hourlyLimit);

      if (!rateLimitCheck.allowed) {
        console.warn(
          `[Worker] ⚠️ Rate limit exceeded for sender ${senderEmail} (${rateLimitCheck.currentCount}/${rateLimitCheck.limit}). Rescheduling to ${rateLimitCheck.nextWindowDate.toISOString()}...`
        );

        // Update DB status to RATE_LIMITED
        await prisma.emailSchedule.update({
          where: { id: emailScheduleId },
          data: {
            status: 'RATE_LIMITED',
            scheduledAt: rateLimitCheck.nextWindowDate,
          },
        });

        // Trigger Slack notification
        await notifyRateLimitHit({
          userId,
          senderEmail,
          hourlyLimit,
          nextAvailableWindow: rateLimitCheck.nextWindowDate.toUTCString(),
        });

        // Reschedule job to next window
        const delayUntilNext = Math.max(0, rateLimitCheck.nextWindowDate.getTime() - Date.now());
        const queue = getEmailQueue();
        await queue.add('send-email', job.data, {
          delay: delayUntilNext,
          jobId: `${emailScheduleId}-retry-${Date.now()}`,
        });

        return;
      }

      // Inter-email delay (provider throttling emulation)
      const throttleDelay = delayBetweenEmailsMs || config.defaultMinDelayMs;
      if (throttleDelay > 0) {
        console.log(`[Worker] Applying provider throttling delay of ${throttleDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, throttleDelay));
      }

      try {
        // Send email via Ethereal SMTP
        const sendResult = await sendEmail({
          from: senderEmail,
          to: recipient,
          subject,
          body,
        });

        const sentAt = new Date();

        // Update DB
        const updatedEmail = await prisma.emailSchedule.update({
          where: { id: emailScheduleId },
          data: {
            status: 'SENT',
            sentAt,
            etherealMessageUrl: sendResult.etherealUrl || null,
            jobId: job.id,
          },
        });

        // Index in Elasticsearch
        await indexEmail({
          id: updatedEmail.id,
          userId: updatedEmail.userId,
          senderEmail: updatedEmail.senderEmail,
          recipient: updatedEmail.recipient,
          subject: updatedEmail.subject,
          body: updatedEmail.body,
          status: updatedEmail.status,
          scheduledAt: updatedEmail.scheduledAt,
          sentAt: updatedEmail.sentAt,
        });

        console.log(`[Worker] ✅ Email ${emailScheduleId} successfully sent to ${recipient}`);
      } catch (sendErr: any) {
        console.error(`[Worker] ❌ Failed to send email ${emailScheduleId}:`, sendErr.message);

        await prisma.emailSchedule.update({
          where: { id: emailScheduleId },
          data: {
            status: 'FAILED',
            error: sendErr.message || 'Unknown SMTP error',
          },
        });

        throw sendErr;
      }
    },
    {
      connection: redisOpts,
      concurrency: config.workerConcurrency,
    }
  );

  emailWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed.`);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
  });

  return emailWorker;
}

/**
 * Persistence & Crash Recovery:
 * On server reboot, scans the DB for any pending/rate-limited emails and re-schedules them
 * so no jobs are ever lost across restarts.
 */
export async function recoverScheduledJobsOnStartup() {
  console.log('[Recovery] Checking DB for pending scheduled emails...');
  try {
    const pendingEmails = await prisma.emailSchedule.findMany({
      where: {
        status: { in: ['SCHEDULED', 'RATE_LIMITED', 'QUEUED'] },
      },
    });

    console.log(`[Recovery] Found ${pendingEmails.length} pending email(s) in DB.`);
    const queue = getEmailQueue();

    for (const email of pendingEmails) {
      const existingJob = await queue.getJob(email.id);
      if (!existingJob) {
        await scheduleEmailJob(
          {
            emailScheduleId: email.id,
            userId: email.userId,
            senderEmail: email.senderEmail,
            recipient: email.recipient,
            subject: email.subject,
            body: email.body,
            delayBetweenEmailsMs: email.delayBetweenEmailsMs,
            hourlyLimit: email.hourlyLimit,
          },
          email.scheduledAt
        );
        console.log(`[Recovery] Re-queued email ${email.id} (Scheduled for: ${email.scheduledAt.toISOString()})`);
      }
    }
  } catch (err: any) {
    console.error('[Recovery] Error during startup recovery:', err.message || err);
  }
}
