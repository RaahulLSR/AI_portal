
import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, body } = req.body;
  const adminEmail = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  // 1. Critical Environment Variable Validation
  if (!adminEmail || !appPassword) {
    console.error('SYSTEM ERROR: Mail configuration missing. Ensure GMAIL_USER and GMAIL_APP_PASSWORD are set in environment variables.');
    return res.status(500).json({ 
      error: 'Mail server misconfigured.', 
      details: 'Missing credentials on server.' 
    });
  }

  // 2. Resolve Recipient
  // If 'to' is 'admin', we notify the system owner. Otherwise, we notify the specific recipient.
  const recipient = to === 'admin' ? adminEmail : to;

  if (!recipient) {
    return res.status(400).json({ error: 'Recipient address is required.' });
  }

  // 3. Create Transporter with Explicit SMTP Config
  // Using explicit host/port is more robust in serverless environments than 'service: gmail'
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL/TLS
    auth: {
      user: adminEmail,
      pass: appPassword,
    },
    // Adding reasonable timeouts to prevent hanging functions
    connectionTimeout: 15000, 
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  const mailOptions = {
    from: `"Nexus Hub System" <${adminEmail}>`,
    to: recipient,
    subject: subject,
    text: body,
  };

  try {
    console.log(`[MailService] Attempting dispatch to: ${recipient}`);
    
    // Verify connection before sending to catch auth errors early
    await transporter.verify();
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[MailService] Success: Message ${info.messageId} delivered.`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Notification dispatched successfully.',
      messageId: info.messageId 
    });
  } catch (error: any) {
    // 4. Detailed Error Logging
    console.error('[MailService] Critical Dispatch Failure:', {
      message: error.message,
      code: error.code,
      response: error.response, // Gmail often provides a detailed reason in the response field
      command: error.command
    });

    return res.status(500).json({ 
      error: 'Failed to transmit notification.', 
      details: error.message,
      smtp_code: error.code
    });
  }
}
