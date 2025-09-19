import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/dbConnect';
import crypto from 'crypto';

export async function POST(req) {
  await connectDB();
  const { email, code } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  if (!user.resetCode) {
    return NextResponse.json({ error: 'Reset code not set' }, { status: 400 });
  }

  if (!user.resetCodeExpires) {
    return NextResponse.json({ error: 'Reset code expiry not set' }, { status: 400 });
  }

  const now = new Date();
  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

  if (hashedCode !== user.resetCode) {
    return NextResponse.json({ error: 'Invalid reset code' }, { status: 400 });
  }

  if (now > user.resetCodeExpires) {
    return NextResponse.json({ error: 'Reset code has expired' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
