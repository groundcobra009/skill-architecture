import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertInternalSecret, roleForEmail } from "./lib";

const graphNode = v.object({
  id: v.string(),
  label: v.string(),
  cat: v.string(),
  role: v.string(),
  desc: v.string(),
  x: v.number(),
  y: v.number(),
});

const connection = v.object({
  from: v.string(),
  to: v.string(),
  type: v.string(),
  label: v.optional(v.string()),
});

const flowStep = v.object({
  n: v.number(),
  text: v.string(),
  detail: v.string(),
  exec: v.string(),
});

const flow = v.object({
  id: v.string(),
  name: v.string(),
  desc: v.string(),
  nodes: v.array(v.string()),
  conns: v.array(v.string()),
  steps: v.array(flowStep),
});

const userArgs = {
  email: v.string(),
  name: v.string(),
  workosUserId: v.string(),
  role: v.optional(v.string()),
};

type AppUser = {
  email: string;
  name: string;
  workosUserId: string;
  role?: string;
};

async function touchUser(ctx: any, user: AppUser) {
  const now = Date.now();
  const existing = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", user.email))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      name: user.name,
      workosUserId: user.workosUserId,
      role: user.role ?? roleForEmail(user.email),
      lastSeenAt: now,
      useCount: existing.useCount + 1,
    });
    return;
  }

  await ctx.db.insert("users", {
    ...user,
    role: user.role ?? roleForEmail(user.email),
    firstSeenAt: now,
    lastSeenAt: now,
    useCount: 1,
  });
}

export const list = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("diagrams")
      .withIndex("by_owner", (q) => q.eq("ownerEmail", args.email))
      .order("desc")
      .take(30);
  },
});

export const save = mutation({
  args: {
    secret: v.string(),
    id: v.optional(v.id("diagrams")),
    user: v.object(userArgs),
    title: v.string(),
    sourceName: v.string(),
    summary: v.string(),
    nodes: v.array(graphNode),
    connections: v.array(connection),
    flows: v.array(flow),
  },
  handler: async (ctx, args) => {
    assertInternalSecret(args.secret);
    const now = Date.now();
    await touchUser(ctx, args.user);

    const payload = {
      title: args.title,
      sourceName: args.sourceName,
      summary: args.summary,
      ownerEmail: args.user.email,
      ownerName: args.user.name,
      workosUserId: args.user.workosUserId,
      nodes: args.nodes,
      connections: args.connections,
      flows: args.flows,
      updatedAt: now,
    };

    if (args.id) {
      await ctx.db.patch(args.id, payload);
      return args.id;
    }

    return await ctx.db.insert("diagrams", {
      ...payload,
      createdAt: now,
    });
  },
});

export const seedDemo = mutation({
  args: {
    secret: v.string(),
    user: v.object(userArgs),
    diagram: v.object({
      title: v.string(),
      sourceName: v.string(),
      summary: v.string(),
      nodes: v.array(graphNode),
      connections: v.array(connection),
      flows: v.array(flow),
    }),
  },
  handler: async (ctx, args) => {
    assertInternalSecret(args.secret);
    await touchUser(ctx, args.user);

    const existing = await ctx.db
      .query("diagrams")
      .withIndex("by_owner", (q) => q.eq("ownerEmail", args.user.email))
      .first();
    if (existing) return existing._id;

    const now = Date.now();
    return await ctx.db.insert("diagrams", {
      ...args.diagram,
      ownerEmail: args.user.email,
      ownerName: args.user.name,
      workosUserId: args.user.workosUserId,
      createdAt: now,
      updatedAt: now,
    });
  },
});
