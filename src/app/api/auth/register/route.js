export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";
import { createAccessToken, createRefreshToken, setAuthCookies } from "@/lib/auth";
import { formatUserData } from "@/utils/formatters";
import crypto from "crypto";

export async function POST(req) {
  try {
    const raw = await req.json();
    const { uid, photoURL } = raw;
    const { name, email, password } = formatUserData(raw);
    if (!name || !email || (!password && !uid)) {
      return NextResponse.json({ error: "Name, email, and either password or UID are required" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email });

    // ❌ Already exists — return conflict
    if (existing) {
      return NextResponse.json({ error: "Email already exists. Try logging in instead." }, { status: 409 });
    }

    // ✅ Create new user
    const user = await User.create({
      name,
      email,
      password: password || crypto.randomBytes(16).toString("hex"), // safe dummy for OAuth
      photoURL: photoURL || "",
      hasOAuth: !!uid,
    });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    const res = NextResponse.json(
      {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      { status: 201 }
    );

    setAuthCookies(res, accessToken, refreshToken);

    return res;
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.email) {
      return NextResponse.json({ error: "Email already exists. Try logging in instead." }, { status: 409 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
