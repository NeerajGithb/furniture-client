export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth';

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 },
    );

    clearAuthCookies(response);
    return response;
  } catch (err) {
    console.error('❌ /logout error:', err);
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 });
  }
}
