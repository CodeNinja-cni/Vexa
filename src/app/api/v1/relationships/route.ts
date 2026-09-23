import { NextResponse, type NextRequest } from "next/server";

import { getRequestPrincipal } from "@/lib/auth/session";
import { getDemoRelationships } from "@/lib/fixtures/relationships";
import { getLiveRelationships } from "@/lib/relationships/live";

export async function GET(request: NextRequest) {
  const principal = await getRequestPrincipal(request);
  if (principal) {
    const live = await getLiveRelationships(principal);
    if (live.people.length > 0) {
      return NextResponse.json(live, {
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

  if (process.env.VEXA_ALLOW_FIXTURE_FALLBACK === "false") {
    return NextResponse.json(
      {
        error: principal
          ? "No synchronized Gmail relationships are available."
          : "Authentication required.",
      },
      { status: principal ? 404 : 401 },
    );
  }

  return NextResponse.json(getDemoRelationships(), {
    headers: { "Cache-Control": "no-store" },
  });
}
