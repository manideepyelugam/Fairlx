import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth & Billing Middleware
 * 
 * ROUTING GUARDS:
 * - Public routes: sign-in, sign-up, verify-email, etc.
 * - Onboarding: Requires auth, redirects if already completed
 * - Billing routes: Always accessible for account recovery
 * - Protected routes: Requires auth + completed onboarding
 * 
 * BILLING STATUS:
 * - Checks X-Billing-Status header from API responses
 * - DUE: Shows warning banner (handled by components)
 * - SUSPENDED: Redirects to billing page (except billing routes)
 * 
 * NOTE: Full user state verification happens in /auth/callback
 * Middleware only does lightweight cookie checks
 */

// Billing-related paths that are always accessible
const BILLING_PATHS = [
  "/organization/settings/billing",
  "/settings/billing",
  "/billing",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get("fairlx-session");
  const billingStatusCookie = request.cookies.get("fairlx-billing-status");

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

  // Check if this is a billing-related path
  const isBillingPath = BILLING_PATHS.some(path => pathname.startsWith(path));

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

  // Billing status check (from cookie set by client after API response)
  // If account is SUSPENDED and not on a billing page, redirect to billing
  if (billingStatusCookie?.value === "SUSPENDED" && !isBillingPath) {
    // Get the appropriate billing URL based on current path
    const billingUrl = pathname.startsWith("/organization")
      ? "/organization/settings/billing"
      : pathname.startsWith("/workspaces/")
        ? `${pathname.split("/").slice(0, 3).join("/")}/billing`
        : "/settings/billing";

    return NextResponse.redirect(new URL(billingUrl, request.url));
  }

  // For authenticated users on protected routes, let the page handle verification
  // Full state checks happen in components/pages
  const response = NextResponse.next();

  // Add billing status header for client-side awareness
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