import { Router } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../services/db';
import { scheduleEmailJob } from '../queue/emailQueue';
import { searchEmails, indexEmail } from '../services/elasticsearch';
import { config } from '../config';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to extract email addresses from text / CSV
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  // Deduplicate and trim
  return Array.from(new Set(matches.map((e) => e.trim().toLowerCase())));
}

// 1. Parse CSV / Text file for leads
router.post(
  '/parse-leads',
  requireAuth,
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      let rawText = '';
      if (req.file) {
        rawText = req.file.buffer.toString('utf-8');
      } else if (req.body.text) {
        rawText = req.body.text;
      } else {
        return res.status(400).json({ error: 'No file or text provided' });
      }

      const emails = extractEmails(rawText);
      return res.json({
        total: emails.length,
        emails,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to parse leads file', details: err.message });
    }
  }
);

// 2. Schedule New Emails (Single or Bulk)
router.post('/schedule', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      subject,
      body,
      recipients,
      senderEmail = 'outbox.sender@reachinbox.ai',
      startTime,
      delayBetweenEmailsMs = config.defaultMinDelayMs,
      hourlyLimit = config.defaultHourlyLimit,
    } = req.body;

    if (!subject || !body || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Subject, body, and at least one recipient are required.' });
    }

    const userId = req.user!.id;
    const baseStartTime = startTime ? new Date(startTime).getTime() : Date.now();
    const delayStep = Number(delayBetweenEmailsMs) || 2000;
    const limit = Number(hourlyLimit) || 200;

    const createdSchedules = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i].trim().toLowerCase();
      // Calculate scheduled time with incremental delay to distribute send times
      const scheduledTime = new Date(baseStartTime + i * delayStep);

      const emailRecord = await prisma.emailSchedule.create({
        data: {
          userId,
          senderEmail,
          recipient,
          subject,
          body,
          scheduledAt: scheduledTime,
          delayBetweenEmailsMs: delayStep,
          hourlyLimit: limit,
          status: 'SCHEDULED',
        },
      });

      // Add to BullMQ
      const jobId = await scheduleEmailJob(
        {
          emailScheduleId: emailRecord.id,
          userId,
          senderEmail,
          recipient,
          subject,
          body,
          delayBetweenEmailsMs: delayStep,
          hourlyLimit: limit,
        },
        scheduledTime
      );

      // Save jobId in record
      await prisma.emailSchedule.update({
        where: { id: emailRecord.id },
        data: { jobId },
      });

      // Index initial schedule in Elasticsearch
      await indexEmail({
        id: emailRecord.id,
        userId,
        senderEmail,
        recipient,
        subject,
        body,
        status: 'SCHEDULED',
        scheduledAt: scheduledTime,
      });

      createdSchedules.push({
        id: emailRecord.id,
        recipient,
        scheduledAt: scheduledTime,
      });
    }

    return res.status(201).json({
      success: true,
      message: `Successfully scheduled ${createdSchedules.length} email(s).`,
      count: createdSchedules.length,
      schedules: createdSchedules,
    });
  } catch (err: any) {
    console.error('[EmailRoutes] Schedule error:', err);
    return res.status(500).json({ error: 'Failed to schedule emails', details: err.message });
  }
});

// 3. Get Scheduled Emails
router.get('/scheduled', requireAuth, async (req: AuthRequest, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : undefined;
    const userId = req.user!.id;

    if (q) {
      const results = await searchEmails({ userId, query: q, status: 'SCHEDULED' });
      return res.json({ emails: results });
    }

    const emails = await prisma.emailSchedule.findMany({
      where: {
        userId,
        status: { in: ['SCHEDULED', 'QUEUED', 'RATE_LIMITED'] },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return res.json({ emails });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch scheduled emails', details: err.message });
  }
});

// 4. Get Sent Emails
router.get('/sent', requireAuth, async (req: AuthRequest, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : undefined;
    const userId = req.user!.id;

    if (q) {
      const results = await searchEmails({ userId, query: q, status: 'SENT' });
      return res.json({ emails: results });
    }

    const emails = await prisma.emailSchedule.findMany({
      where: {
        userId,
        status: { in: ['SENT', 'FAILED'] },
      },
      orderBy: { sentAt: 'desc' },
    });

    return res.json({ emails });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch sent emails', details: err.message });
  }
});

// 5. Universal Search
router.get('/search', requireAuth, async (req: AuthRequest, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : '';
    const status = req.query.status ? String(req.query.status) : undefined;
    const userId = req.user!.id;

    const emails = await searchEmails({ userId, query: q, status });
    return res.json({ emails });
  } catch (err: any) {
    return res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

export default router;
