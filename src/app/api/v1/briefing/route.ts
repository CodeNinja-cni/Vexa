import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getRequestPrincipal } from "@/lib/auth/session";
import { getLiveDashboardData } from "@/lib/briefing/live";
import { briefingItemSchema } from "@/lib/domain/models";
import { rankBriefingItems } from "@/lib/domain/ranking";
import { briefingItems } from "@/lib/fixtures/briefing";

const briefingResponseSchema = z.object({
  mode: z.enum(["live", "fixture"]),
  generatedAt: z.string().datetime(),
  completenessWarning: z.string().optional(),
  items: z.array(briefingItemSchema),
});

export async function GET(request: NextRequest) {
  const principal = await getRequestPrincipal(request);

  if (principal) {
    const live = await getLiveDashboardData(principal);
    const response = briefingResponseSchema.parse({
      mode: "live",
      generatedAt: new Date().toISOString(),
      completenessWarning:
        live.briefingItems.length === 0
          ? "Google is connected, but no current priority records are available. Run a sync or check permissions."
          : "Gmail and Calendar are live. Other intelligence surfaces remain demonstration data.",
      items: live.briefingItems,
    });

    return NextResponse.json(response, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (process.env.VEXA_ALLOW_FIXTURE_FALLBACK === "false") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const response = briefingResponseSchema.parse({
    mode: "fixture",
    generatedAt: new Date().toISOString(),
    completenessWarning:
      "Demo briefing. Connect Google Workspace to use live Gmail and Calendar evidence.",
    items: rankBriefingItems(briefingItems),
  });

  return NextResponse.json(response, {
    headers: { "Cache-Control": "no-store" },
  });
}
