
import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, body } = req.body;
  const adminEmail = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  if (!adminEmail || !appPassword) {
    return res.status(500).json({ error: 'Mail environment variables not configured.' });
  }

  const recipient = to === 'admin' ? adminEmail : to;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: adminEmail,
      pass: appPassword,
    },
  });

  const mailOptions = {
    from: `"Nexus Hub System" <${adminEmail}>`,
    to: recipient,
    subject: subject,
    text: body,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'Notification sent.' });
  } catch (error: any) {
    console.error('SMTP Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
