// lib/middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
}

/**
 * Authentication middleware for API routes
 * @param request NextRequest object
 * @returns Object with user data or error response
 */
export async function authenticateUser(request: NextRequest): Promise<{
  user: AuthenticatedUser | null;
  error: NextResponse | null;
}> {
  try {
    const accessToken = request.cookies.get('vf_access')?.value;
    
    if (!accessToken) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized - No access token', success: false }, 
          { status: 401 }
        )
      };
    }

    const decoded = verifyAccessToken(accessToken);
    
    if (!decoded || !decoded.userId) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized - Invalid access token', success: false }, 
          { status: 401 }
        )
      };
    }

    // Validate token expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized - Token expired', success: false }, 
          { status: 401 }
        )
      };
    }

    return {
      user: decoded as AuthenticatedUser,
      error: null
    };
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication failed', success: false }, 
        { status: 401 }
      )
    };
  }
}

/**
 * Higher-order function that wraps API route handlers with authentication
 * @param handler The API route handler function
 * @returns Wrapped handler with authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const { user, error } = await authenticateUser(request);
      
      if (error) {
        return error;
      }
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required', success: false }, 
          { status: 401 }
        );
      }

      return handler(request, user, ...args);
    } catch (error) {
      console.error('❌ withAuth wrapper error:', error);
      return NextResponse.json(
        { error: 'Internal server error', success: false }, 
        { status: 500 }
      );
    }
  };
}

/**
 * Optional authentication middleware - doesn't fail if no user
 * @param request NextRequest object
 * @returns Object with user data (can be null) and no error
 */
export async function optionalAuth(request: NextRequest): Promise<{
  user: AuthenticatedUser | null;
}> {
  try {
    const accessToken = request.cookies.get('vf_access')?.value;
    
    if (!accessToken) {
      return { user: null };
    }

    const decoded = verifyAccessToken(accessToken);
    
    if (!decoded || !decoded.userId) {
      return { user: null };
    }

    // Check token expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return { user: null };
    }

    return { user: decoded as AuthenticatedUser };
  } catch (error) {
    console.error('❌ Optional auth error:', error);
    return { user: null };
  }
}

/**
 * Middleware for routes that work with or without authentication
 * @param handler The API route handler function
 * @returns Wrapped handler with optional authentication
 */
export function withOptionalAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser | null, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const { user } = await optionalAuth(request);
      return handler(request, user, ...args);
    } catch (error) {
      console.error('❌ withOptionalAuth wrapper error:', error);
      return NextResponse.json(
        { error: 'Internal server error', success: false }, 
        { status: 500 }
      );
    }
  };
}

/**
 * Admin-only authentication wrapper
 * @param handler The API route handler function
 * @returns Wrapped handler with admin checking
 */
export function withAdminAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: AuthenticatedUser, ...args: T) => {
    try {
      // Check if user email indicates admin status (customize as needed)
      const isAdmin = user.email?.includes('admin') || 
                     user.email?.endsWith('@yourdomain.com'); // Replace with your logic
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required', success: false }, 
          { status: 403 }
        );
      }
      
      return handler(request, user, ...args);
    } catch (error) {
      console.error('❌ withAdminAuth wrapper error:', error);
      return NextResponse.json(
        { error: 'Internal server error', success: false }, 
        { status: 500 }
      );
    }
  });
}

/**
 * Rate limiting helper (basic implementation)
 * @param identifier Unique identifier for rate limiting (e.g., user ID, IP)
 * @param maxRequests Maximum requests allowed
 * @param windowMs Time window in milliseconds
 * @returns boolean indicating if request should be allowed
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const key = identifier;
  const existing = rateLimitMap.get(key);

  if (!existing) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > existing.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count++;
  return true;
}

/**
 * Rate limited authentication wrapper
 * @param maxRequests Maximum requests per window
 * @param windowMs Time window in milliseconds
 * @param handler The API route handler function
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<T extends any[]>(
  maxRequests: number,
  windowMs: number,
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: AuthenticatedUser, ...args: T) => {
    try {
      const identifier = user.userId;
      
      if (!checkRateLimit(identifier, maxRequests, windowMs)) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.', success: false }, 
          { status: 429 }
        );
      }
      
      return handler(request, user, ...args);
    } catch (error) {
      console.error('❌ withRateLimit wrapper error:', error);
      return NextResponse.json(
        { error: 'Internal server error', success: false }, 
        { status: 500 }
      );
    }
  });
}