import { v } from "convex/values";
import { query } from "./_generated/server";
import { assertInternalSecret, roleForEmail } from "./lib";

export const overview = query({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    assertInternalSecret(args.secret);
    const users = await ctx.db.query("users").withIndex("by_lastSeenAt").order("desc").take(100);
    const events = await ctx.db.query("usageEvents").withIndex("by_at").order("desc").take(120);
    const diagrams = await ctx.db.query("diagrams").withIndex("by_updatedAt").order("desc").take(80);
    const normalizedUsers = users.map((user) => ({
      ...user,
      role: user.role ?? roleForEmail(user.email),
    }));
    const normalizedEvents = events.map((event) => ({
      ...event,
      role: event.role ?? roleForEmail(event.email),
    }));

    return {
      users: normalizedUsers,
      events: normalizedEvents,
      diagrams,
      totals: {
        users: users.length,
        admins: normalizedUsers.filter((user) => user.role === "admin").length,
        events: events.length,
        diagrams: diagrams.length,
      },
    };
  },
});
