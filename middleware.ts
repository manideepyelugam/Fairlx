import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight Auth Middleware
 * 
 * DESIGN PRINCIPLE:
 * Middleware only does cookie-based checks. All routing logic
 * is delegated to LifecycleGuard which consumes resolveUserLifecycleState().
 * 
 * This prevents routing logic duplication and ensures single source of truth.
 * 
 * WHAT THIS DOES:
 * 1. Allows public paths (auth, static, API)
 * 2. Redirects unauthenticated users to sign-in
 * 3. Passes billing status header for client awareness
 * 
 * WHAT THIS DOES NOT DO:
 * - No onboarding routing (handled by LifecycleGuard)
 * - No billing redirect logic (handled by LifecycleGuard)
 * - No path-based permission checks
 */

// Public paths that never require authentication
const PUBLIC_PATHS = [
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get("fairlx-session");
  const billingStatusCookie = request.cookies.get("fairlx-billing-status");

  // 1. Allow static files, API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Allow public paths
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 3. Redirect unauthenticated users to sign-in
  if (!authCookie) {
    const returnUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/sign-in?returnUrl=${returnUrl}`, request.url));
  }

  // 4. Pass through with billing status header
  const response = NextResponse.next();
  if (billingStatusCookie) {
    response.headers.set("X-Billing-Status", billingStatusCookie.value);
  }

  return response;
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