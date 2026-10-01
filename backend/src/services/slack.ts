import axios from 'axios';
import { prisma } from './db';
import { config } from '../config';

export async function getSlackAuthUrl(userId: string): Promise<string> {
  const scopes = ['incoming-webhook', 'chat:write'];
  const params = new URLSearchParams({
    client_id: config.slackClientId,
    scope: scopes.join(','),
    redirect_uri: config.slackRedirectUri,
    state: userId,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function handleSlackOAuthCallback(code: string, userId: string) {
  try {
    const response = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      null,
      {
        params: {
          client_id: config.slackClientId,
          client_secret: config.slackClientSecret,
          code,
          redirect_uri: config.slackRedirectUri,
        },
      }
    );

    const data = response.data;
    if (!data.ok) {
      throw new Error(`Slack OAuth error: ${data.error}`);
    }

    const webhookUrl = data.incoming_webhook?.url;
    const channel = data.incoming_webhook?.channel || data.incoming_webhook?.channel_id;
    const teamName = data.team?.name;
    const accessToken = data.access_token;

    const integration = await prisma.slackIntegration.upsert({
      where: { userId },
      update: {
        accessToken,
        incomingWebhookUrl: webhookUrl,
        channel,
        teamName,
        isConnected: true,
      },
      create: {
        userId,
        accessToken,
        incomingWebhookUrl: webhookUrl,
        channel,
        teamName,
        isConnected: true,
      },
    });

    console.log(`[Slack] Successfully connected Slack for user ${userId}`);
    return integration;
  } catch (err: any) {
    console.error('[Slack] OAuth exchange failed:', err.message || err);
    throw err;
  }
}

export async function notifyRateLimitHit({
  userId,
  senderEmail,
  hourlyLimit,
  nextAvailableWindow,
}: {
  userId: string;
  senderEmail: string;
  hourlyLimit: number;
  nextAvailableWindow: string;
}) {
  try {
    const integration = await prisma.slackIntegration.findUnique({
      where: { userId },
    });

    if (!integration || !integration.isConnected) {
      console.log(`[Slack] User ${userId} has not connected Slack. Skipping Slack alert.`);
      return;
    }

    const message = {
      text: `⚠️ *ReachInbox Email Rate Limit Alert* ⚠️\n*Sender:* \`${senderEmail}\` reached hourly limit of *${hourlyLimit} emails/hour*.\nPending jobs have been rescheduled to start at: *${nextAvailableWindow}*.\nNo emails were dropped.`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '⚠️ Rate Limit Reached',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Sender:*\n\`${senderEmail}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Hourly Limit:*\n${hourlyLimit} emails/hr`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Action taken:* Rescheduled remaining queued emails to *${nextAvailableWindow}*.`,
          },
        },
      ],
    };

    if (integration.incomingWebhookUrl) {
      await axios.post(integration.incomingWebhookUrl, message);
      console.log(`[Slack] Rate limit alert sent via webhook for user ${userId}`);
    } else if (integration.accessToken && integration.channel) {
      await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: integration.channel,
          ...message,
        },
        {
          headers: { Authorization: `Bearer ${integration.accessToken}` },
        }
      );
      console.log(`[Slack] Rate limit alert sent via Web API for user ${userId}`);
    }
  } catch (err: any) {
    console.warn(`[Slack] Failed to send Slack alert (non-fatal):`, err.message || err);
  }
}
