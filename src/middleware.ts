/**
 * Next.js Middleware for Route Protection
 * Handles authentication and role-based access control at the edge
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/api/auth',
  '/api/test',
  '/api/test-calendar-public',
  '/api/test-email-public',
  '/api/test-workflow-public',
];

// Admin-only routes
const adminRoutes = [
  '/admin',
];

// Route-to-permission mapping for protected routes
const routePermissions: Record<string, string> = {
  '/dashboard': 'view:dashboard',
  '/calendar': 'view:calendar',
  '/settings/email-scanning': 'view:email-scanning',
  '/settings/calendar': 'view:calendar',
  '/messages': 'view:messages',
  '/health': 'view:health',
  '/investments': 'view:investments',
  '/expenses': 'view:expenses',
  '/insurance': 'view:insurance',
  '/legal': 'view:legal',
  '/tax': 'view:tax',
  '/travel': 'view:travel',
  '/workflows': 'manage:automation',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and API routes that handle their own auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Get token from NextAuth
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Check route permissions
  const requiredPermission = routePermissions[pathname];
  if (requiredPermission) {
    const role = token.role as string;
    const accessMode = token.accessMode as string | undefined;

    // Import permission check (we'll need to make this work in middleware)
    // For now, basic role check - full permission check happens in page components
    if (role === 'admin') {
      return NextResponse.next();
    }

    // Basic checks for now - detailed permission checks in page components
    if (role === 'client' && accessMode === 'hands-off') {
      // Hands-off clients have limited access
      if (['/messages', '/calendar'].includes(pathname)) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/messages', request.url));
    }

    if (role === 'client' && accessMode === 'ai-only') {
      // AI-only clients can only access messages
      if (pathname === '/messages') {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/messages', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
