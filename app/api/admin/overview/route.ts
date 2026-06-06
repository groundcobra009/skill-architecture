import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { getCurrentUser, isAdmin } from "../../../lib/auth";
import { getConvexClient, internalSecret } from "../../../lib/convex";

export async function GET() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const overview = await getConvexClient().query(api.admin.overview, {
    secret: internalSecret(),
  });

  return NextResponse.json({ user, overview });
}
