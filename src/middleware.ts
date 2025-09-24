import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode_payload_from_token, isAuthenticated } from "./lib/auth.service";
import { RoleType } from "./types/common.types";


export const UNPROTECTED_ROUTES = [
  "/",
  "/login",
]


export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const isPublicPath = UNPROTECTED_ROUTES.includes(pathname);

    // Check auth
    const is_auth = await isAuthenticated(request);

    // Try to extract role from token
    const token = request.cookies.get("access_token")?.value;

    let userRole: RoleType | null = null;

    if (token) {
      try {
        const tokenResult = decode_payload_from_token(token);
        userRole = tokenResult?.payload?.role ?? null;
      } catch (err) {
        console.error("[MIDDLEWARE] Failed to parse token:", err);
      }
    }

    const response = NextResponse.next();
    response.headers.set("x-middleware-cache", "no-cache");

    // 1. Redirect logged-in users away from /login
    if (pathname === "/login" && is_auth && userRole) {
      return NextResponse.redirect(new URL(`/dashboard`, request.url));
    }

    // 2. Block access to protected routes if not authenticated
    if (!isPublicPath && !is_auth) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  } catch (err) {
    console.error("[MIDDLEWARE] Unexpected error:", err);
    return NextResponse.redirect(new URL("/error", request.url)); // Optional fallback
  }
}

export const config = {
  matcher: [
    "/((?!api|_next|static|favicon.png|site.webmanifest|Images|icon-512.png|signin).*)",
  ],
};

