import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/db';
import { config } from '../config';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const googleClient = new OAuth2Client(config.googleClientId);

// Google Sign-in verify
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    let email = '';
    let name = '';
    let avatar = '';
    let googleId = '';

    // Verify Google ID token if CLIENT_ID is configured
    if (config.googleClientId) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({ error: 'Invalid Google payload' });
      }
      email = payload.email;
      name = payload.name || payload.email.split('@')[0];
      avatar = payload.picture || '';
      googleId = payload.sub;
    } else {
      // Decode directly if in local dev without explicit client ID
      const decoded: any = jwt.decode(credential);
      if (!decoded || !decoded.email) {
        return res.status(400).json({ error: 'Could not decode Google token' });
      }
      email = decoded.email;
      name = decoded.name || email.split('@')[0];
      avatar = decoded.picture || '';
      googleId = decoded.sub || email;
    }

    // Upsert user in DB
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, avatar, googleId },
      create: { email, name, avatar, googleId },
      include: { slackIntegration: true },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        slackConnected: !!(user.slackIntegration && user.slackIntegration.isConnected),
      },
    });
  } catch (err: any) {
    console.error('[Auth] Google login error:', err);
    return res.status(500).json({ error: 'Failed to authenticate with Google', details: err.message });
  }
});

// Demo login for quick testing and reviewer evaluations
router.post('/demo', async (req, res) => {
  try {
    const email = req.body.email || 'demo.user@reachinbox.ai';
    const name = req.body.name || 'Demo Reviewer';
    const avatar =
      req.body.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, avatar },
      create: { email, name, avatar },
      include: { slackIntegration: true },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        slackConnected: !!(user.slackIntegration && user.slackIntegration.isConnected),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to demo login', details: err.message });
  }
});

// Current User Profile & Slack status
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { slackIntegration: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        slackConnected: !!(user.slackIntegration && user.slackIntegration.isConnected),
        slackTeam: user.slackIntegration?.teamName || null,
        slackChannel: user.slackIntegration?.channel || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch user', details: err.message });
  }
});

export default router;
