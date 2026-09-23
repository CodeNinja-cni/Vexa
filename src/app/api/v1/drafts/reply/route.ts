import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getRequestPrincipal } from "@/lib/auth/session";
import {
  createPreparedReply,
  EvidenceAccessError,
} from "@/lib/intelligence/drafts";

const prepareReplyRequestSchema = z.object({
  sourceRecordIds: z.array(z.string().uuid()).min(1).max(10),
  instruction: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const principal = await getRequestPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = prepareReplyRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid draft request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const correlationId = request.headers.get("x-correlation-id") ?? randomUUID();

  try {
    const action = await createPreparedReply(
      principal,
      parsed.data.sourceRecordIds,
      parsed.data.instruction,
      correlationId,
    );

    return NextResponse.json(
      { mode: "deterministic", correlationId, action },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof EvidenceAccessError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message =
      error instanceof Error ? error.message : "Reply preparation failed.";
    return NextResponse.json(
      { error: message, correlationId },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }
}
