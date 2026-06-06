import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "../../../lib/auth";

const requestSchema = z.object({
  sourceName: z.string().min(1).max(120),
  content: z.string().min(80).max(24000),
});

const fallbackModel = "claude-haiku-4-5-20251001";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 412 },
    );
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || fallbackModel;

  const message = await anthropic.messages.create({
    model,
    max_tokens: 3000,
    temperature: 0.2,
    system:
      "You convert skill documentation into compact architecture graph JSON. Return only valid JSON. Do not wrap in markdown.",
    messages: [
      {
        role: "user",
        content: `Create a Japanese skill architecture diagram from this source.

Schema:
{
  "title": string,
  "sourceName": string,
  "summary": string,
  "nodes": [{"id": string, "label": string, "cat": "external|entry|detail|tool|parallel|config|output", "role": string, "desc": string, "x": number, "y": number}],
  "connections": [{"from": string, "to": string, "type": "normal|dashed|par", "label"?: string}],
  "flows": [{"id": string, "name": string, "desc": string, "nodes": string[], "conns": string[], "steps": [{"n": number, "text": string, "detail": string, "exec": "claude|sub"}]}]
}

Rules:
- Use 6 to 10 nodes.
- IDs must be lowercase snake_case.
- conns must use the exact "from→to" form and must match connections.
- Place nodes left to right with x values from 40 to 1400.
- Keep labels short.

sourceName: ${parsed.data.sourceName}

content:
${parsed.data.content}`,
      },
    ],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "AI response was not valid JSON.", raw: text }, { status: 502 });
  }
}
