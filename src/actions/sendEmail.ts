'use server';

import nodemailer from 'nodemailer';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function sendEmailNotification(payload: {
  phaseData: any;
  students: any[];
}) {
  console.log('--- Server Action: sendEmailNotification ---');
  console.log('Payload received headers:', payload ? 'Yes' : 'No');

  // Debug Environment Variables (Masked)
  console.log('Env Check:', {
    HOST: process.env.EMAIL_HOST,
    PORT: process.env.EMAIL_PORT,
    USER: process.env.EMAIL_USER ? '***' : 'MISSING',
    PASS: process.env.EMAIL_PASS ? '***' : 'MISSING'
  });

  try {
    if (!payload || !payload.phaseData || !payload.students) {
      console.error('Validation failed: Missing phaseData or students');
      return { success: false, error: 'Invalid payload: Missing phaseData or students' };
    }

    const { phaseData, students } = payload;

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    try {
      await transporter.verify();
      console.log('SMTP Connection verified');
    } catch (error: any) {
      console.error('SMTP Verification Failed:', error.message);
      return { success: false, error: 'SMTP Connection Failed: ' + error.message };
    }

    console.log(`Starting individual email sends for ${students.length} students...`);
    const results = [];

    for (const student of students) {
      const mailOptions = {
        from: `"Levelone admin" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
        to: student.email,
        subject: `New Phase Assigned: Phase ${phaseData.phase_number} - ${phaseData.title}`,
        html: `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="color: #2563eb; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">New Learning Phase Available!</h1>
                </div>
                
                <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">Hi ${student.name || 'student'},</p>
                
                <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                  A new phase has been assigned to your curriculum: 
                  <span style="color: #1e293b; font-weight: 700;">Phase ${phaseData.phase_number}: ${phaseData.title}</span>.
                </p>
                
                <div style="margin: 24px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; border-left: 4px solid #2563eb;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Description</p>
                  <p style="margin: 0; font-size: 16px; color: #1e293b; line-height: 1.5;">${phaseData.description || 'Check the portal for full details.'}</p>
                </div>
                
                <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                  Log in to the student dashboard to explore the new resources, watch the video, and check your requirements.
                </p>
                
                <div style="margin-top: 32px; text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://webdev1.edgeone.app'}" 
                     style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; transition: background-color 0.2s;">
                    Go to Dashboard
                  </a>
                </div>
                
                <hr style="margin: 40px 0 20px 0; border: 0; border-top: 1px solid #e2e8f0;" />
                
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
                  This is an automated notification from the Levelone Learning Platform.
                </p>
              </div>
            `,
      };

      try {
        await transporter.sendMail(mailOptions);
        results.push({ email: student.email, status: 'sent' });
        // Jitter for human-like sending
        const jitter = Math.floor(Math.random() * 1000);
        await delay(1000 + jitter);
      } catch (error: any) {
        console.error(`Failed to send email to ${student.email}:`, error);
        results.push({ email: student.email, status: 'failed', error: error.message });
      }
    }

    const failed = results.filter(r => r.status === 'failed');
    return {
      success: true,
      sentCount: results.length - failed.length,
      failedCount: failed.length
    };
  } catch (error: any) {
    console.error('CRITICAL SERVER ACTION ERROR:', error);
    return {
      success: false,
      error: `Server Action Crashed: ${error.message || 'Unknown error'}`
    };
  }
}
