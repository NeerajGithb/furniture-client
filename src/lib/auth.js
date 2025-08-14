export const runtime = "nodejs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { serialize } from "cookie";

const ACCESS_TOKEN_NAME = "vf_access";
const REFRESH_TOKEN_NAME = "vf_refresh";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("Missing JWT secret(s)");
}

// =============================
// Token Creation
// =============================
export const createAccessToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(), // Ensure it's a string
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

export const createRefreshToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

// =============================
// Token Verification
// =============================
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
};

// =============================
// Get Refresh Token from Cookies (Server-side)
// =============================
export const getRefreshTokenFromCookie = (req) => {
  // Inside API route handler
  if (req?.cookies) {
    return req.cookies.get(REFRESH_TOKEN_NAME)?.value || null;
  }

  // Inside server component / middleware
  return cookies().get(REFRESH_TOKEN_NAME)?.value || null;
};

// =============================
// Set Auth Cookies (access + refresh)
// =============================
export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.headers.append(
    "Set-Cookie",
    serialize(ACCESS_TOKEN_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15, // 15 minutes
    })
  );

  res.headers.append(
    "Set-Cookie",
    serialize(REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  );
};

// =============================
// Clear Auth Cookies
// =============================
export const clearAuthCookies = (res) => {
  res.headers.append(
    "Set-Cookie",
    serialize(ACCESS_TOKEN_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );

  res.headers.append(
    "Set-Cookie",
    serialize(REFRESH_TOKEN_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );
};
