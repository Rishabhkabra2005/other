import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/patient") && token.role !== "PATIENT") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (path.startsWith("/doctor") && token.role !== "DOCTOR") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (path.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        const publicPaths = ["/", "/login", "/register", "/verify-otp"];
        if (publicPaths.some((p) => path === p || path.startsWith("/api/auth"))) {
          return true;
        }
        if (path.startsWith("/api/")) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/admin/:path*",
  ],
};
