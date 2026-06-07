import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { assertInternalSecret, roleForEmail } from "./lib";

export const track = mutation({
  args: {
    secret: v.string(),
    user: v.object({
      email: v.string(),
      name: v.string(),
      workosUserId: v.string(),
      role: v.optional(v.string()),
    }),
    action: v.string(),
    detail: v.string(),
  },
  handler: async (ctx, args) => {
    assertInternalSecret(args.secret);
    const now = Date.now();

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.user.email))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.user.name,
        workosUserId: args.user.workosUserId,
        role: args.user.role ?? roleForEmail(args.user.email),
        lastSeenAt: now,
        useCount: existing.useCount + 1,
      });
    } else {
      await ctx.db.insert("users", {
        ...args.user,
        role: args.user.role ?? roleForEmail(args.user.email),
        firstSeenAt: now,
        lastSeenAt: now,
        useCount: 1,
      });
    }

    await ctx.db.insert("usageEvents", {
      ...args.user,
      role: args.user.role ?? roleForEmail(args.user.email),
      action: args.action,
      detail: args.detail,
      at: now,
    });
  },
});
