
import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, body } = req.body;
  const adminEmail = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  // Debug check for environment variables (without exposing them fully)
  if (!adminEmail || !appPassword) {
    console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment variables');
    return res.status(500).json({ 
      error: 'Server configuration error: Mail variables missing.',
      missing: { user: !adminEmail, pass: !appPassword }
    });
  }

  const recipient = to === 'admin' ? adminEmail : to;

  // Explicit SMTP configuration for Gmail
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: adminEmail,
      pass: appPassword,
    },
  });

  const mailOptions = {
    from: `"Nexus Hub" <${adminEmail}>`,
    to: recipient,
    subject: subject,
    text: body,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return res.status(200).json({ success: true, message: 'Notification sent successfully.' });
  } catch (error: any) {
    console.error('SMTP Delivery Error:', error);
    return res.status(500).json({ 
      error: 'Email delivery failed.', 
      details: error.message 
    });
  }
}
