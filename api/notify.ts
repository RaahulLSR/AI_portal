
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

  if (!adminEmail || !appPassword) {
    console.error('Mail configuration missing');
    return res.status(500).json({ 
      error: 'Server configuration error: environment variables not set.',
      missing: { user: !adminEmail, pass: !appPassword }
    });
  }

  const recipient = to === 'admin' ? adminEmail : to;

  // Most robust Gmail SMTP config for cloud providers
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL/TLS
    auth: {
      user: adminEmail,
      pass: appPassword,
    },
    tls: {
      rejectUnauthorized: false // Often needed for serverless environments
    }
  });

  const mailOptions = {
    from: `"Nexus Hub" <${adminEmail}>`,
    to: recipient,
    subject: subject,
    text: body,
  };

  try {
    await transporter.verify(); // Test connection before sending
    const info = await transporter.sendMail(mailOptions);
    console.log('Notification successful:', info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('SMTP Delivery Error:', error);
    return res.status(500).json({ 
      error: 'Email delivery failed.', 
      details: error.message 
    });
  }
}
