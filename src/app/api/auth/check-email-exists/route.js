import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  await connectDB();
  const user = await User.findOne({ email }).select('+hasOAuth');

  if (!user) return NextResponse.json({ exists: false }, { status: 200 });

  return NextResponse.json({
    exists: true,
    hasOAuth: user.hasOAuth === true,
  });
}
