export const runtime = 'nodejs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const ACCESS_TOKEN_NAME = 'vf_access';
const REFRESH_TOKEN_NAME = 'vf_refresh';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('Missing JWT secret(s)');
}

// JWT Token Functions
export const createAccessToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '15m' },
  );

export const createRefreshToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' },
  );

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

// Server-side Cookie Functions
export const getAccessTokenFromCookie = async (req) => {
  try {
    if (req?.cookies) {
      return req.cookies.get(ACCESS_TOKEN_NAME)?.value || null;
    }
    const cookieStore = await cookies();
    return cookieStore.get(ACCESS_TOKEN_NAME)?.value || null;
  } catch (error) {
    return null;
  }
};

export const getRefreshTokenFromCookie = async (req) => {
  try {
    if (req?.cookies) {
      return req.cookies.get(REFRESH_TOKEN_NAME)?.value || null;
    }
    const cookieStore = await cookies();
    return cookieStore.get(REFRESH_TOKEN_NAME)?.value || null;
  } catch (error) {
    return null;
  }
};

export const getCurrentUser = async (req) => {
  try {
    const accessToken = await getAccessTokenFromCookie(req);
    if (!accessToken) return null;
    const decoded = verifyAccessToken(accessToken);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Cookie Management
export const setAuthCookies = (response, accessToken, refreshToken) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set({
      name: ACCESS_TOKEN_NAME,
      value: accessToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15,
    });

    response.cookies.set({
      name: REFRESH_TOKEN_NAME,
      value: refreshToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return true;
  } catch (error) {
    return false;
  }
};

export const clearAuthCookies = (response) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set({
      name: ACCESS_TOKEN_NAME,
      value: '',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set({
      name: REFRESH_TOKEN_NAME,
      value: '',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return true;
  } catch (error) {
    return false;
  }
};
