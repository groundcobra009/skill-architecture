import "server-only";

import { getSignInUrl, withAuth } from "@workos-inc/authkit-nextjs";
import type { AppUser } from "./types";

const defaultAdminEmails = ["nakashima.keitarou@gmail.com"];

function adminEmails() {
  const configured = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([...defaultAdminEmails, ...configured]));
}

function roleForEmail(email: string): AppUser["role"] {
  return adminEmails().includes(email.toLowerCase()) ? "admin" : "member";
}

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
      role: "admin",
    };
  }

  const { user } = await withAuth();
  if (!user?.email) return null;

  const email = user.email.toLowerCase();

  return {
    email,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || email,
    workosUserId: user.id,
    isDemo: false,
    role: roleForEmail(email),
  };
}

export async function getAuthLinks() {
  if (!isWorkOSConfigured()) {
    return { signIn: "/login" };
  }
  return {
    signIn: await getSignInUrl(),
  };
}

export function isAdmin(user: AppUser | null) {
  if (!user) return false;
  return user.role === "admin";
}
