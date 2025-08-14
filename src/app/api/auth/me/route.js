export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies(); // no need for await
    const token = cookieStore.get("vf_access")?.value;

    if (!token) {
      return NextResponse.json({ error: "Access token missing", user: null }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token", user: null }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(payload.userId).select("name email _id photoURL");
    if (!user) {
      return NextResponse.json({ error: "User not found", user: null }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error", user: null }, { status: 500 });
  }
}
