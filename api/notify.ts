
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
    console.error('[System] Environment variables GMAIL_USER or GMAIL_APP_PASSWORD are not set.');
    return res.status(500).json({ 
      error: 'Mail configuration missing.', 
      details: 'The server is missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables.' 
    });
  }

  // 2. Resolve final recipient
  const recipient = to === 'admin' ? adminEmail : to;
  if (!recipient) {
    return res.status(400).json({ error: 'Missing recipient email address.' });
  }

  // 3. Create Transporter using 'service' shortcut
  // 'service: gmail' is generally more reliable than manual host/port settings in Vercel
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: adminEmail,
      pass: appPassword,
    },
  });

  // 4. Construct Mail
  const mailOptions = {
    from: `"Nexus Hub" <${adminEmail}>`,
    to: recipient,
    subject: subject,
    text: body,
  };

  try {
    console.log(`[Mail] Attempting delivery to: ${recipient}`);
    
    // We attempt send directly. Nodemailer will catch auth/connection errors here.
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Mail] Success: ${info.messageId}`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Email delivered.',
      messageId: info.messageId 
    });
  } catch (error: any) {
    // 5. Detailed Error Extraction
    console.error('[Mail] SMTP Error:', error);

    // Provide specific feedback for common Gmail errors
    let userFriendlyError = 'Failed to send notification.';
    if (error.code === 'EAUTH') {
      userFriendlyError = 'SMTP Authentication failed. Check your App Password.';
    } else if (error.code === 'ESOCKET') {
      userFriendlyError = 'Connection to Gmail was blocked by the network.';
    }

    return res.status(500).json({ 
      success: false,
      error: userFriendlyError,
      raw_error: error.message,
      smtp_code: error.code
    });
  }
}
