import { authkitProxy } from "@workos-inc/authkit-nextjs";

export default authkitProxy({
  redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
});

export const config = {
  matcher: ["/", "/admin/:path*", "/api/:path*", "/callback", "/login", "/logout"],
};
