import { ConvexError } from "convex/values";

export function assertInternalSecret(secret: string) {
  const configured = process.env.APP_INTERNAL_SECRET;
  if (configured && secret !== configured) {
    throw new ConvexError("Invalid internal secret");
  }
}
