import { NextResponse, type NextRequest } from "next/server";

import { getRequestPrincipal } from "@/lib/auth/session";
import { getLiveFocusPlan } from "@/lib/focus/live";
import { getDemoFocusPlan } from "@/lib/fixtures/focus";

export async function GET(request: NextRequest) {
  const principal = await getRequestPrincipal(request);
  if (principal) {
    const live = await getLiveFocusPlan(principal);
    if (live.events.length > 0) {
      return NextResponse.json(live, {
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

  if (process.env.VEXA_ALLOW_FIXTURE_FALLBACK === "false") {
    return NextResponse.json(
      {
        error: principal
          ? "No synchronized Google Calendar events are available for the next workday."
          : "Authentication required.",
      },
      { status: principal ? 404 : 401 },
    );
  }

  return NextResponse.json(getDemoFocusPlan(), {
    headers: { "Cache-Control": "no-store" },
  });
}
