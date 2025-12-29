
import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase using the credentials found in the project's supabase.ts
const supabaseUrl = 'https://ewgzwwumjimlrimiavld.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Z3p3d3VtamltbHJpbWlhdmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMDM4NzEsImV4cCI6MjA4MjU3OTg3MX0.-k3mVwDvLrkSPwn7Vm5cvXEaPhFInYJP_de7tZuet94';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { to, subject, body } = req.body;
  const gmailUser = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  // 1. Validate environment variables for the sender account
  if (!gmailUser || !appPassword) {
    console.error('[System] CRITICAL: GMAIL_USER or GMAIL_APP_PASSWORD not configured.');
    return res.status(500).json({ 
      error: 'Mail server configuration missing.', 
      details: 'Check GMAIL_USER and GMAIL_APP_PASSWORD env vars.' 
    });
  }

  // 2. Resolve the Receiving Mail ID
  let recipient = '';
  
  if (to === 'admin') {
    try {
      // Query Supabase for profiles with the 'admin' role
      const { data: adminProfiles, error: dbError } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'admin')
        .limit(1);

      if (dbError) throw dbError;

      if (adminProfiles && adminProfiles.length > 0) {
        recipient = adminProfiles[0].email;
        console.log('[Mail] Resolved Admin email from database:', recipient);
      } else {
        // Fallback to environment variable if no admin found in DB
        recipient = gmailUser;
        console.warn('[Mail] No admin profile found in database. Falling back to GMAIL_USER:', recipient);
      }
    } catch (err: any) {
      console.error('[Mail] Database error while fetching admin email:', err.message);
      recipient = gmailUser; // Safe fallback
    }
  } else if (to && typeof to === 'string' && to.includes('@')) {
    recipient = to;
    console.log('[Mail] Routing to Customer Address:', recipient);
  } else {
    console.error('[Mail] ERROR: No valid receiving email provided:', { to });
    return res.status(400).json({ 
      error: 'Invalid recipient.', 
      details: 'The field "to" must be "admin" or a valid email address.' 
    });
  }

  // 3. Create Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: appPassword,
    },
  });

  const mailOptions = {
    from: `"Nexus Hub" <${gmailUser}>`,
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
      raw_error: error.message
    });
  }
}
