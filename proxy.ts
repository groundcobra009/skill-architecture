import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const workosProxy = authkitProxy({
  redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
});

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (
    !process.env.WORKOS_API_KEY ||
    !process.env.WORKOS_CLIENT_ID ||
    !process.env.WORKOS_COOKIE_PASSWORD ||
    !process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI
  ) {
    return NextResponse.next();
  }

  return workosProxy(request, event);
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/:path*", "/callback", "/login", "/logout"],
};
