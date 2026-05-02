import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminDb } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';

// Gmail SMTP transporter — uses env vars set in Vercel + .env.local
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,      // e.g. rafiqunnabi07@gmail.com
      pass: process.env.SMTP_PASS,      // Gmail App Password (16-char)
    },
  });
}

export async function POST(request) {
  try {
    const { action, password, otp } = await request.json();

    const docRef = adminDb.collection('config').doc('superadmin_security');
    const docSnap = await docRef.get();
    const data = docSnap.exists ? docSnap.data() : {};

    // ── 1. Set / Reset Password ──────────────────────────────
    if (action === 'set') {
      if (data.passwordHash && !otp) {
        return NextResponse.json(
          { success: false, error: 'Password already set. Use Forgot Password to reset.' },
          { status: 400 }
        );
      }
      if (otp) {
        if (data.resetOtp !== otp || Date.now() > data.otpExpiry) {
          return NextResponse.json(
            { success: false, error: 'Invalid or expired OTP. Please request a new one.' },
            { status: 400 }
          );
        }
      }
      const newHash = bcrypt.hashSync(password, 10);
      await docRef.set({ passwordHash: newHash, resetOtp: null, otpExpiry: null }, { merge: true });
      return NextResponse.json({ success: true, message: 'Password configured successfully.' });
    }

    // ── 2. Forgot Password — Send OTP via Gmail ───────────────
    if (action === 'forgot') {
      const adminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
      if (!adminEmail) {
        return NextResponse.json(
          { success: false, error: 'Admin email not configured in environment.' },
          { status: 500 }
        );
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

      // Save OTP to Firestore first
      await docRef.set({ resetOtp: generatedOtp, otpExpiry: expiry }, { merge: true });

      // Check SMTP credentials
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        // Fallback: log OTP to server console (for dev/testing only)
        console.warn(`[SUPERADMIN OTP] No SMTP configured. OTP for ${adminEmail}: ${generatedOtp}`);
        return NextResponse.json({
          success: true,
          message: 'OTP generated. Check server logs (SMTP not configured).',
          devOtp: process.env.NODE_ENV === 'development' ? generatedOtp : undefined,
        });
      }

      // Send email via Gmail SMTP
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Webmaa System" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: '🔐 Webmaa Admin — Password Reset OTP',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0f0f; border-radius: 16px; border: 1px solid #1f1f1f;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 14px; line-height: 56px; font-size: 28px;">🛡️</div>
            </div>
            <h1 style="color: #fff; font-size: 22px; font-weight: 900; text-align: center; margin: 0 0 8px;">Password Reset Request</h1>
            <p style="color: #666; font-size: 14px; text-align: center; margin: 0 0 32px;">Someone requested a Superadmin deletion password reset on Webmaa.</p>
            <div style="background: #1a1a1a; border: 2px dashed #333; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="color: #888; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 12px;">Your One-Time Password</p>
              <div style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #fff; font-family: 'Courier New', monospace;">${generatedOtp}</div>
              <p style="color: #555; font-size: 12px; margin: 12px 0 0;">Valid for <strong style="color: #ef4444;">15 minutes</strong> only</p>
            </div>
            <p style="color: #555; font-size: 12px; text-align: center; margin: 0;">If you did not request this, ignore this email. Your account remains secure.</p>
            <hr style="border: none; border-top: 1px solid #1f1f1f; margin: 24px 0;">
            <p style="color: #333; font-size: 11px; text-align: center; margin: 0;">Webmaa System — Automated Security Alert</p>
          </div>
        `,
      });

      return NextResponse.json({ success: true, message: `OTP sent to ${adminEmail}` });
    }

    // ── 3. Verify Password ────────────────────────────────────
    if (action === 'verify') {
      if (!data.passwordHash) {
        return NextResponse.json(
          { success: false, error: 'NO_PASSWORD_SET' },
          { status: 400 }
        );
      }
      const isValid = bcrypt.compareSync(password, data.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Incorrect password. Try again or use Forgot Password.' },
          { status: 401 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('[Superadmin Verify Password] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
