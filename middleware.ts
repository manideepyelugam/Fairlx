import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth Middleware
 * 
 * ROUTING GUARDS:
 * - Public routes: sign-in, sign-up, verify-email, etc.
 * - Onboarding: Requires auth, redirects if already completed
 * - Protected routes: Requires auth + completed onboarding
 * 
 * NOTE: Full user state verification happens in /auth/callback
 * Middleware only does lightweight cookie checks
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get("fairlx-session");

  // Public routes - always accessible
  const publicPaths = [
    "/sign-in",
    "/sign-up",
    "/verify-email",
    "/verify-email-sent",
    "/verify-email-needed",
    "/forgot-password",
    "/reset-password",
    "/oauth",
    "/auth/callback",
  ];

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Allow static files, API routes, and public paths to pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    isPublicPath
  ) {
    return NextResponse.next();
  }

  // Onboarding routes - require auth but not completed onboarding
  if (pathname.startsWith("/onboarding")) {
    if (!authCookie) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    // Allow access to onboarding
    return NextResponse.next();
  }

  // Protected routes - require auth
  if (!authCookie) {
    const returnUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/sign-in?returnUrl=${returnUrl}`, request.url));
  }

  // For authenticated users on protected routes, let the page handle verification
  // Full state checks happen in components/pages
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};