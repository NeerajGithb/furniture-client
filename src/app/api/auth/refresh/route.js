export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyRefreshToken, createAccessToken, createRefreshToken, setAuthCookies } from "@/lib/auth";
import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("vf_refresh")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    const res = NextResponse.json({ success: true }, { status: 200 });
    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res;
  } catch (err) {
    console.error("❌ /refresh error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
