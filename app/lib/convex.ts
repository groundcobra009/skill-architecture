import "server-only";

import { ConvexHttpClient } from "convex/browser";

let client: ConvexHttpClient | null = null;

export function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured. Run `npx convex dev` first.");
  }
  if (!client) client = new ConvexHttpClient(url);
  return client;
}

export function internalSecret() {
  return process.env.APP_INTERNAL_SECRET || "";
}
