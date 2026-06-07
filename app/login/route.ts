import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { isWorkOSConfigured } from "../lib/auth";

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

export async function GET(request: NextRequest) {
  if (!isWorkOSConfigured()) redirect("/");
  redirect(
    await getSignInUrl({
      returnTo: safeReturnTo(request.nextUrl.searchParams.get("returnTo")),
    }),
  );
}
