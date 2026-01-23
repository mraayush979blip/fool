import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  // Create transporter inside handler to ensure we pick up the latest .env.local changes
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

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log('SMTP Connection verified successfully');
  } catch (verifyError: any) {
    console.error('SMTP Verification Failed:', {
      host: process.env.EMAIL_HOST,
      user: process.env.EMAIL_USER,
      passLength: process.env.EMAIL_PASS?.length || 0,
      error: verifyError.message
    });
    return NextResponse.json({
      error: 'SMTP Authentication Failed',
      details: 'Please check your Brevo Master Password in .env.local',
      smtp_error: verifyError.message
    }, { status: 500 });
  }

  try {
    const rawBody = await request.text();
    console.log('--- Email API Raw Body ---');
    console.log(rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e: any) {
      console.error('Email API JSON Parse Error:', e.message);
      return NextResponse.json({ error: 'Invalid JSON body', details: e.message }, { status: 400 });
    }

    let { phaseData, students, studentEmails } = body;

    // Backwards compatibility for old "studentEmails" key
    if (!students && studentEmails && Array.isArray(studentEmails)) {
      console.log('Mapping legacy studentEmails to students array');
      students = studentEmails.map(email => ({ email, name: 'student' }));
    }

    console.log('--- Email API Payload Check ---');
    console.log('Has phaseData:', !!phaseData, 'Type:', typeof phaseData);
    console.log('Has students:', !!students, 'Type:', typeof students, 'IsArray:', Array.isArray(students));

    if (!phaseData || !students || !Array.isArray(students)) {
      const missing = [];
      if (!phaseData) missing.push('phaseData');
      if (!students) missing.push('students');
      if (students && !Array.isArray(students)) missing.push('students (not an array)');

      console.error('Email API 400 Error: Validation failed:', missing);
      return NextResponse.json({
        error: `Validation failed: missing or invalid ${missing.join(', ')}`,
        received: {
          keys: Object.keys(body),
          phaseDataType: typeof phaseData,
          studentsType: typeof students,
          isStudentsArray: Array.isArray(students)
        }
      }, { status: 400 });
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

        // Cautious Throttling: 3 seconds fixed + up to 2 seconds random jitter
        // This makes the sending pattern look much more "human" to Gmail filters
        const jitter = Math.floor(Math.random() * 2000);
        await delay(3000 + jitter);
      } catch (error: any) {
        console.error(`Failed to send email to ${student.email}:`, error);
        results.push({ email: student.email, status: 'failed', error: error.message });
      }
    }

    const failed = results.filter(r => r.status === 'failed');
    if (failed.length > 0) {
      console.warn(`Email sending completed with ${failed.length} failures.`);
    }

    return NextResponse.json({
      success: true,
      sentCount: results.length - failed.length,
      failedCount: failed.length
    });
  } catch (error: any) {
    console.error('Nodemailer Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
