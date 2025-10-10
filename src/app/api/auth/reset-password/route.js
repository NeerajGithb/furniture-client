import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import User from '@/models/User';
import { connectDB } from '@/lib/dbConnect';

export async function POST(req) {
  await connectDB();
  const { email, newPassword } = await req.json();

  if (!email || !newPassword) {
    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
  }

  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  user.password = newPassword;

  user.resetCode = undefined;
  user.resetCodeExpires = undefined;
  await user.save();

  return NextResponse.json({ success: true });
}
