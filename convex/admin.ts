import { v } from "convex/values";
import { query } from "./_generated/server";
import { assertInternalSecret } from "./lib";

export const overview = query({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    assertInternalSecret(args.secret);
    const users = await ctx.db.query("users").withIndex("by_lastSeenAt").order("desc").take(100);
    const events = await ctx.db.query("usageEvents").withIndex("by_at").order("desc").take(120);
    const diagrams = await ctx.db.query("diagrams").withIndex("by_updatedAt").order("desc").take(80);

    return {
      users,
      events,
      diagrams,
      totals: {
        users: users.length,
        events: events.length,
        diagrams: diagrams.length,
      },
    };
  },
});
