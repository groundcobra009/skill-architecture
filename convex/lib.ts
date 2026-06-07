import { ConvexError } from "convex/values";

export function assertInternalSecret(secret: string) {
  const configured = process.env.APP_INTERNAL_SECRET;
  if (configured && secret !== configured) {
    throw new ConvexError("Invalid internal secret");
  }
}

const defaultAdminEmails = ["nakashima.keitarou@gmail.com"];

export function roleForEmail(email: string) {
  const configured = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const admins = new Set([...defaultAdminEmails, ...configured]);

  return admins.has(email.toLowerCase()) ? "admin" : "member";
}
