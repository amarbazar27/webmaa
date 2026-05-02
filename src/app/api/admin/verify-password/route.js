import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const { action, password, otp } = await request.json();
    
    // Using a specific document for superadmin config
    const docRef = adminDb.collection('config').doc('superadmin_security');
    const docSnap = await docRef.get();
    const data = docSnap.exists ? docSnap.data() : {};

    // 1. Set Initial Password
    if (action === 'set') {
      if (data.passwordHash && !otp) {
        return NextResponse.json({ success: false, error: 'Password already set. Need OTP to reset.' }, { status: 400 });
      }
      if (otp) {
        if (data.resetOtp !== otp || Date.now() > data.otpExpiry) {
          return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
        }
      }
      const newHash = bcrypt.hashSync(password, 10);
      await docRef.set({ passwordHash: newHash, resetOtp: null, otpExpiry: null }, { merge: true });
      return NextResponse.json({ success: true, message: 'Password configured successfully' });
    }

    // 2. Request OTP for Forgot Password
    if (action === 'forgot') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const adminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@webmaa.com';
      
      await docRef.set({ 
        resetOtp: generatedOtp, 
        otpExpiry: Date.now() + 15 * 60000 // 15 mins
      }, { merge: true });

      // Trigger Firebase Email Extension (writes to 'mail' collection)
      await adminDb.collection('mail').add({
        to: adminEmail,
        message: {
          subject: 'Webmaa Superadmin Reset OTP',
          text: `Your OTP to reset the Superadmin deletion password is: ${generatedOtp}. It is valid for 15 minutes.`
        }
      });

      return NextResponse.json({ success: true, message: 'OTP sent to admin email' });
    }

    // 3. Verify Password
    if (action === 'verify') {
      if (!data.passwordHash) {
        return NextResponse.json({ success: false, error: 'NO_PASSWORD_SET' }, { status: 400 });
      }
      
      const isValid = bcrypt.compareSync(password, data.passwordHash);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error("Superadmin Security Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
