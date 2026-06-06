import "server-only";

import { getSignInUrl, getSignUpUrl, withAuth } from "@workos-inc/authkit-nextjs";
import type { AppUser } from "./types";

export function isWorkOSConfigured() {
  return Boolean(
    process.env.WORKOS_API_KEY &&
      process.env.WORKOS_CLIENT_ID &&
      process.env.WORKOS_COOKIE_PASSWORD &&
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
  );
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (!isWorkOSConfigured()) {
    if (process.env.VERCEL_ENV === "production") return null;
    return {
      email: "demo-admin@local.test",
      name: "Demo Admin",
      workosUserId: "local-demo-user",
      isDemo: true,
    };
  }

  const { user } = await withAuth();
  if (!user?.email) return null;

  return {
    email: user.email,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
    workosUserId: user.id,
    isDemo: false,
  };
}

export async function getAuthLinks() {
  if (!isWorkOSConfigured()) {
    return { signIn: "/login", signUp: "/login" };
  }
  return {
    signIn: await getSignInUrl(),
    signUp: await getSignUpUrl(),
  };
}

export function isAdmin(user: AppUser | null) {
  if (!user) return false;
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (user.isDemo && admins.length === 0) return true;
  return admins.includes(user.email.toLowerCase());
}
