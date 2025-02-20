import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/chats',
    '/tokens',
    '/account',
    '/portfolio',
  ]
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has('privy-token');

  // Redirect to chats if authenticated and at root/dashboard
  if (isAuthenticated && (pathname === '/' || pathname === '/dashboard')) {
    return NextResponse.redirect(new URL('/chats', request.url));
  }

  // Redirect to home if not authenticated and trying to access protected routes
  if (!isAuthenticated && pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
} 