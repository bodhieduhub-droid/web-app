import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

// Setup transporter similar to the project's internal email lib
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

async function sendClarification() {
  console.log('Fetching students to send clarification...');
  
  const { data: students, error } = await supabase
    .from('readers')
    .select('name, email')
    .in('status', ['active', 'pending_onboarding', 'pending_payment']);

  if (error) {
    console.error('Error fetching students:', error);
    return;
  }

  const validStudents = students.filter(s => s.email && s.email.includes('@'));
  console.log(`Sending clarification to ${validStudents.length} students...`);

  const payloads = validStudents.map(student => ({
    from: `"Bodhi Edu Hub" <${process.env.EMAIL_FROM}>`,
    to: student.email,
    subject: "Clarification: Regarding the recent Payment Notice",
    html: `
      <div style="font-family: sans-serif; color: #1b3022; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d8e0d4; border-radius: 12px;">
        <h2 style="color: #1b3022;">Important Clarification</h2>
        <p>Hi ${student.name},</p>
        <p>Please <strong>ignore</strong> the payment overdue notice you may have received earlier today.</p>
        <p>Due to a technical update in our billing system, some notices were sent prematurely. We would like to clarify that the due date for your monthly fee is the <strong>5th of every month</strong>. Overdue reminders will only be sent if payment is not received by that date.</p>
        <p>If you have already paid, please ignore this message as well. We apologize for any confusion or inconvenience this may have caused.</p>
        <hr style="border: none; border-top: 1px solid #eef3ea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6d7c6c;">Best regards,<br/><strong>Team Bodhi Edu Hub</strong></p>
      </div>
    `
  }));

  // Send in batches of 10 to avoid rate limits
  for (let i = 0; i < payloads.length; i += 10) {
    const batch = payloads.slice(i, i + 10);
    await Promise.all(batch.map(p => transporter.sendMail(p)));
    console.log(`Sent ${Math.min(i + 10, payloads.length)} / ${payloads.length}`);
  }

  console.log('All clarification emails sent successfully.');
}

sendClarification();
