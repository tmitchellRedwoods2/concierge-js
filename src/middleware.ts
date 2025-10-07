/**
 * Middleware for route protection
 * Note: Authentication is handled by NextAuth.js on the client side
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // For now, let NextAuth handle authentication on the client side
  // This middleware can be enhanced later for server-side route protection
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};

