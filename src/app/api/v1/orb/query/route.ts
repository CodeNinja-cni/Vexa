import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getRequestPrincipal } from "@/lib/auth/session";
import {
  buildGroundedOrbAnswer,
  orbAnswerSchema,
} from "@/lib/intelligence/orb";
import { getFixtureOrbEvidence } from "@/lib/intelligence/orb-fixtures";
import { retrieveOrbEvidence } from "@/lib/intelligence/orb-live";

const requestSchema = z.object({
  query: z.string().trim().min(2).max(500),
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ask a question between 2 and 500 characters." },
      { status: 400 },
    );
  }

  const principal = await getRequestPrincipal(request);
  if (principal) {
    const evidence = await retrieveOrbEvidence(principal);
    if (evidence.length > 0) {
      return NextResponse.json(
        orbAnswerSchema.parse(
          buildGroundedOrbAnswer(parsed.data.query, evidence, "live"),
        ),
        { headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  if (process.env.VEXA_ALLOW_FIXTURE_FALLBACK === "false") {
    return NextResponse.json(
      { error: principal ? "No synchronized evidence is available." : "Authentication required." },
      { status: principal ? 404 : 401 },
    );
  }

  return NextResponse.json(
    orbAnswerSchema.parse(
      buildGroundedOrbAnswer(
        parsed.data.query,
        getFixtureOrbEvidence(),
        "fixture",
      ),
    ),
    { headers: { "Cache-Control": "no-store" } },
  );
}
