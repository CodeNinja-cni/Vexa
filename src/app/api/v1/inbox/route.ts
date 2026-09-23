import { NextResponse, type NextRequest } from "next/server";

import { getRequestPrincipal } from "@/lib/auth/session";
import { getDemoInbox } from "@/lib/fixtures/inbox";
import { getLiveInbox } from "@/lib/inbox/live";

export async function GET(request: NextRequest) {
  const principal = await getRequestPrincipal(request);
  if (principal) {
    const live = await getLiveInbox(principal);
    if (live.items.length > 0) {
      return NextResponse.json(live, {
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

  if (process.env.VEXA_ALLOW_FIXTURE_FALLBACK === "false") {
    return NextResponse.json(
      { error: principal ? "No synchronized Gmail messages are available." : "Authentication required." },
      { status: principal ? 404 : 401 },
    );
  }

  return NextResponse.json(getDemoInbox(), {
    headers: { "Cache-Control": "no-store" },
  });
}
