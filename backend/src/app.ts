import express from 'express';
import cors from 'cors';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import slackRoutes from './routes/slackRoutes';
import { getEmailQueue } from './queue/emailQueue';

export function createApp() {
  const app = express();

  // CORS & Body parsing
  app.use(
    cors({
      origin: '*',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Bull Board Setup
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const emailQueue = getEmailQueue();
  createBullBoard({
    queues: [new BullMQAdapter(emailQueue)],
    serverAdapter: serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/emails', emailRoutes);
  app.use('/api/slack', slackRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'ReachInbox Scheduler API',
      status: 'online',
      endpoints: {
        health: '/health',
        bullBoard: '/admin/queues',
        auth: '/api/auth',
        emails: '/api/emails',
        slack: '/api/slack',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'ReachInbox Scheduler API',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
