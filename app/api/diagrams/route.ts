import { NextResponse } from "next/server";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";
import { getCurrentUser } from "../../lib/auth";
import { getConvexClient, internalSecret } from "../../lib/convex";
import { demoDiagram } from "../../lib/demo-diagram";

const nodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  cat: z.string().min(1),
  role: z.string(),
  desc: z.string(),
  x: z.number(),
  y: z.number(),
});

const connectionSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  type: z.string().min(1),
  label: z.string().optional(),
});

const flowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  desc: z.string(),
  nodes: z.array(z.string()),
  conns: z.array(z.string()),
  steps: z.array(
    z.object({
      n: z.number(),
      text: z.string(),
      detail: z.string(),
      exec: z.string(),
    }),
  ),
});

const diagramSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  sourceName: z.string().min(1),
  summary: z.string(),
  nodes: z.array(nodeSchema).min(1),
  connections: z.array(connectionSchema),
  flows: z.array(flowSchema),
});

function convexUser(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  return {
    email: user.email,
    name: user.name,
    workosUserId: user.workosUserId,
    role: user.role,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const convex = getConvexClient();
  await convex.mutation(api.usage.track, {
    secret: internalSecret(),
    user: convexUser(user),
    action: "open_workspace",
    detail: "Opened diagram workspace",
  });

  let diagrams = await convex.query(api.diagrams.list, { email: user.email });
  if (diagrams.length === 0) {
    await convex.mutation(api.diagrams.seedDemo, {
      secret: internalSecret(),
      user: convexUser(user),
      diagram: demoDiagram,
    });
    diagrams = await convex.query(api.diagrams.list, { email: user.email });
  }

  return NextResponse.json({ user, diagrams });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = diagramSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const convex = getConvexClient();
  const { id, ...diagram } = parsed.data;
  const savedId = await convex.mutation(api.diagrams.save, {
    secret: internalSecret(),
    id: id as any,
    user: convexUser(user),
    ...diagram,
  });

  await convex.mutation(api.usage.track, {
    secret: internalSecret(),
    user: convexUser(user),
    action: "save_diagram",
    detail: diagram.title,
  });

  return NextResponse.json({ id: savedId });
}
