
import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { to, subject, body } = req.body;
  const adminEmail = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  // 1. Validate environment variables
  if (!adminEmail || !appPassword) {
    console.error('[System] CRITICAL: GMAIL_USER or GMAIL_APP_PASSWORD not configured in Vercel.');
    return res.status(500).json({ 
      error: 'Mail server configuration missing.', 
      details: 'Check GMAIL_USER and GMAIL_APP_PASSWORD env vars.' 
    });
  }

  // 2. Resolve the Receiving Mail ID
  let recipient = '';
  if (to === 'admin') {
    recipient = adminEmail;
    console.log('[Mail] Routing to System Admin:', recipient);
  } else if (to && typeof to === 'string' && to.includes('@')) {
    recipient = to;
    console.log('[Mail] Routing to Customer Address:', recipient);
  } else {
    console.error('[Mail] ERROR: No valid receiving email provided in request body:', { to });
    return res.status(400).json({ 
      error: 'Invalid recipient.', 
      details: 'The field "to" must be "admin" or a valid email address.' 
    });
  }

  // 3. Create Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
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
    console.log(`[Mail] Success! ID: ${info.messageId} -> ${recipient}`);
    
    return res.status(200).json({ 
      success: true, 
      recipient: recipient,
      messageId: info.messageId 
    });
  } catch (error: any) {
    console.error('[Mail] SMTP Failure:', error.message);
    return res.status(500).json({ 
      success: false,
      error: 'SMTP Transmission Error',
      raw_error: error.message,
      smtp_code: error.code
    });
  }
}
