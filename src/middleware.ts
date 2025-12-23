/**
 * Next.js Middleware for Route Protection
 * Protects routes that require authentication
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
    '/profile',
    '/settings',
    '/problem',
    '/problems',
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = [
    '/login',
    '/register',
];

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const { pathname } = request.nextUrl;

    // Check if trying to access protected route without auth
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    if (isProtectedRoute && !token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Check if trying to access auth routes while logged in
    const isAuthRoute = authRoutes.some(route => pathname === route);
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// Only run middleware on specific protected routes
export const config = {
    matcher: [
        '/profile/:path*',
        '/settings/:path*',
        '/problem/:path*',
        '/problems/:path*',
        '/login',
        '/register',
    ],
};
