export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";

export async function POST() {
  try {
    const res = NextResponse.json({ message: "Successfully logged out" }, { status: 200 });

    clearAuthCookies(res);
    return res;
  } catch (err) {
    return NextResponse.json({ error: "Logout failed. Please try again later." }, { status: 500 });
  }
}
