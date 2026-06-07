import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    workosUserId: v.string(),
    role: v.optional(v.string()),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    useCount: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_lastSeenAt", ["lastSeenAt"]),

  diagrams: defineTable({
    title: v.string(),
    sourceName: v.string(),
    summary: v.string(),
    ownerEmail: v.string(),
    ownerName: v.string(),
    workosUserId: v.string(),
    nodes: v.array(graphNode),
    connections: v.array(connection),
    flows: v.array(flow),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerEmail"])
    .index("by_updatedAt", ["updatedAt"]),

  usageEvents: defineTable({
    email: v.string(),
    name: v.string(),
    workosUserId: v.string(),
    role: v.optional(v.string()),
    action: v.string(),
    detail: v.string(),
    at: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_at", ["at"]),
});
