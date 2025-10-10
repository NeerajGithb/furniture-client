export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import User from '@/models/User';
import { createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { name, email, photoURL, uid } = await req.json();

    if (!name || !email || !uid) {
      return NextResponse.json({ error: 'Missing required user data' }, { status: 400 });
    }

    await connectDB();

    let user = await User.findOne({ email });
    const isFirstTime = !user;

    if (!user) {
      user = await User.create({
        name,
        email,
        photoURL: photoURL || '',
        password: crypto.randomBytes(16).toString('hex'),
        hasOAuth: true,
      });
    } else {
      let shouldUpdate = false;

      if (!user.hasOAuth) {
        user.hasOAuth = true;
        shouldUpdate = true;
      }

      if (photoURL && user.photoURL !== photoURL) {
        user.photoURL = photoURL;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await user.save();
      }
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    const res = NextResponse.json(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        photoURL: user.photoURL,
        hasOAuth: user.hasOAuth,
        firstTime: isFirstTime,
      },
      { status: 200 },
    );

    setAuthCookies(res, accessToken, refreshToken);
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
