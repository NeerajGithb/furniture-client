// lib/auth.js
export const runtime = "nodejs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

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
      userId: user._id.toString(),
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
  } catch (error) {
    console.error("Access token verification failed:", error.message);
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    console.error("Refresh token verification failed:", error.message);
    return null;
  }
};

// =============================
// Get Refresh Token from Cookies (Server-side)
// =============================
export const getRefreshTokenFromCookie = async (req) => {
  try {
    // Inside API route handler
    if (req?.cookies) {
      return req.cookies.get(REFRESH_TOKEN_NAME)?.value || null;
    }

    // Inside server component / middleware
    const cookieStore = await cookies();
    return cookieStore.get(REFRESH_TOKEN_NAME)?.value || null;
  } catch (error) {
    console.error("Error getting refresh token from cookie:", error);
    return null;
  }
};

// =============================
// Set Auth Cookies (NextResponse compatible)
// =============================
export const setAuthCookies = (response, accessToken, refreshToken) => {
  try {
    // Set access token cookie
    response.cookies.set({
      name: ACCESS_TOKEN_NAME,
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15, // 15 minutes
    });

    // Set refresh token cookie
    response.cookies.set({
      name: REFRESH_TOKEN_NAME,
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    
  } catch (error) {
    console.error("Error setting auth cookies:", error);
  }
};

// =============================
// Clear Auth Cookies (NextResponse compatible)
// =============================
export const clearAuthCookies = (response) => {
  try {
    // Clear access token cookie
    response.cookies.set({
      name: ACCESS_TOKEN_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    // Clear refresh token cookie
    response.cookies.set({
      name: REFRESH_TOKEN_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    
  } catch (error) {
    console.error("Error clearing auth cookies:", error);
  }
};

// =============================
// Alternative method using headers (if cookies.set doesn't work)
// =============================
export const setAuthCookiesViaHeaders = (response, accessToken, refreshToken) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const secureFlag = isProduction ? "Secure; " : "";
    
    response.headers.set(
      "Set-Cookie",
      [
        `${ACCESS_TOKEN_NAME}=${accessToken}; HttpOnly; ${secureFlag}SameSite=Lax; Path=/; Max-Age=${60 * 15}`,
        `${REFRESH_TOKEN_NAME}=${refreshToken}; HttpOnly; ${secureFlag}SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`
      ].join(", ")
    );
    
    
  } catch (error) {
    console.error("Error setting auth cookies via headers:", error);
  }
};

export const clearAuthCookiesViaHeaders = (response) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const secureFlag = isProduction ? "Secure; " : "";
    
    response.headers.set(
      "Set-Cookie",
      [
        `${ACCESS_TOKEN_NAME}=; HttpOnly; ${secureFlag}SameSite=Lax; Path=/; Max-Age=0`,
        `${REFRESH_TOKEN_NAME}=; HttpOnly; ${secureFlag}SameSite=Lax; Path=/; Max-Age=0`
      ].join(", ")
    );
    
    
  } catch (error) {
    console.error("Error clearing auth cookies via headers:", error);
  }
};