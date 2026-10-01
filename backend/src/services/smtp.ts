import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;
let testAccount: nodemailer.TestAccount | null = null;

export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) {
    return transporter;
  }

  try {
    console.log('[SMTP] Initializing Ethereal Email test account...');
    testAccount = await nodemailer.createTestAccount();
    console.log(`[SMTP] Ethereal account ready: ${testAccount.user}`);

    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    return transporter;
  } catch (err) {
    console.error('[SMTP] Failed to initialize Ethereal Email transporter:', err);
    throw err;
  }
}

export interface SendEmailParams {
  from?: string;
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  messageId: string;
  etherealUrl: string | false;
}

export async function sendEmail({
  from = 'outbox.sender@reachinbox.ai',
  to,
  subject,
  body,
}: SendEmailParams): Promise<SendEmailResult> {
  const mailer = await getTransporter();

  const info = await mailer.sendMail({
    from: `ReachInbox Sender <${from}>`,
    to,
    subject,
    text: body,
    html: `<div style="font-family: sans-serif; line-height: 1.5; color: #111827;">${body.replace(
      /\n/g,
      '<br/>'
    )}</div>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`[SMTP] Email sent to ${to}. Message ID: ${info.messageId}`);
  if (previewUrl) {
    console.log(`[SMTP] 🔗 Ethereal Live Preview: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    etherealUrl: previewUrl,
  };
}
