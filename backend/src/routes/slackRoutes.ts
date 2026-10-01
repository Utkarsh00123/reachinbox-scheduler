import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getSlackAuthUrl, handleSlackOAuthCallback, notifyRateLimitHit } from '../services/slack';
import { prisma } from '../services/db';
import { config } from '../config';

const router = Router();

// Get Slack OAuth Redirect URL
router.get('/auth-url', requireAuth, async (req: AuthRequest, res) => {
  try {
    const url = await getSlackAuthUrl(req.user!.id);
    return res.json({ url });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate Slack OAuth URL', details: err.message });
  }
});

// Slack OAuth Callback Handler
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('[Slack] OAuth callback error:', error);
    return res.redirect(`${config.frontendUrl}?slack_status=error&message=${encodeURIComponent(String(error))}`);
  }

  if (!code || !state) {
    return res.redirect(`${config.frontendUrl}?slack_status=error&message=Missing_code_or_state`);
  }

  try {
    const userId = String(state);
    await handleSlackOAuthCallback(String(code), userId);
    return res.redirect(`${config.frontendUrl}?slack_status=connected`);
  } catch (err: any) {
    console.error('[Slack] OAuth exchange error:', err);
    return res.redirect(`${config.frontendUrl}?slack_status=error&message=${encodeURIComponent(err.message)}`);
  }
});

// Disconnect Slack
router.post('/disconnect', requireAuth, async (req: AuthRequest, res) => {
  try {
    await prisma.slackIntegration.deleteMany({
      where: { userId: req.user!.id },
    });
    return res.json({ success: true, message: 'Slack disconnected successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to disconnect Slack', details: err.message });
  }
});

// Test Rate Limit Alert (For verification / live demo)
router.post('/test-alert', requireAuth, async (req: AuthRequest, res) => {
  try {
    const senderEmail = req.body.senderEmail || 'outbox.sender@reachinbox.ai';
    const hourlyLimit = req.body.hourlyLimit || 200;
    const nextWindow = new Date(Date.now() + 3600 * 1000).toUTCString();

    await notifyRateLimitHit({
      userId: req.user!.id,
      senderEmail,
      hourlyLimit,
      nextAvailableWindow: nextWindow,
    });

    return res.json({ success: true, message: 'Test alert sent to Slack' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to send test Slack alert', details: err.message });
  }
});

export default router;
