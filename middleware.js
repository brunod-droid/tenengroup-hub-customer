import { NextResponse } from 'next/server';

export function middleware(request) {
  return new Response(
    JSON.stringify({
      username: process.env.SITE_USERNAME || "MISSING",
      password: process.env.SITE_PASSWORD ? "FOUND" : "MISSING",
    }),
    {
      headers: { "content-type": "application/json" },
    }
  );
}

export const config = {
  matcher: "/:path*",
};
