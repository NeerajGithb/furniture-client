export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import {
  verifyRefreshToken,
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '@/lib/auth';
import { connectDB } from '@/lib/dbConnect';
import User from '@/models/User';
import { cookies } from 'next/headers';

export async function POST() {
  let response;

  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('vf_refresh')?.value;

    if (!refreshToken) {
      response = NextResponse.json({ error: 'No refresh token', success: false }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload?.userId) {
      response = NextResponse.json(
        { error: 'Invalid refresh token', success: false },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }

    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) {
      response = NextResponse.json({ error: 'User not found', success: false }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }

    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    response = NextResponse.json(
      { success: true, message: 'Tokens refreshed successfully' },
      { status: 200 },
    );

    setAuthCookies(response, newAccessToken, newRefreshToken);
    return response;
  } catch (err) {
    console.error('❌ /refresh error:', err);
    response = NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 },
    );
    clearAuthCookies(response);
    return response;
  }
}
