export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import User from '@/models/User';
import { createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth';
import { formatUserData } from '@/utils/formatters';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const raw = await req.json();
    const { uid, photoURL } = raw;
    const { name, email, password } = formatUserData(raw);

    if (!name || !email || (!password && !uid)) {
      return NextResponse.json(
        { error: 'Name, email, and password (or OAuth UID) are required' },
        { status: 400 },
      );
    }

    if (!uid && password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already exists. Try logging in instead.' },
        { status: 409 },
      );
    }

    const newUser = await User.create({
      name,
      email,
      password: password || crypto.randomBytes(16).toString('hex'),
      photoURL: photoURL || '',
      hasOAuth: !!uid,
    });

    const accessToken = createAccessToken(newUser);
    const refreshToken = createRefreshToken(newUser);

    const res = NextResponse.json(
      {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        slug: newUser.slug,
      },
      { status: 201 },
    );

    setAuthCookies(res, accessToken, refreshToken);

    return res;
  } catch (err) {
    console.error('Registration error:', err);

    if (err.code === 11000) {
      if (err.keyPattern?.email) {
        return NextResponse.json(
          { error: 'Email already exists. Try logging in instead.' },
          { status: 409 },
        );
      }
      if (err.keyPattern?.slug) {
        return NextResponse.json({ error: 'Slug conflict. Try again.' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
