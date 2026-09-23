import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  ActionNotFoundError,
  revisePersistedReply,
} from "@/lib/actions/persistence";
import { getRequestPrincipal } from "@/lib/auth/session";
import { ApprovalTransitionError } from "@/lib/domain/approvals";

const revisionSchema = z.object({
  subject: z.string().trim().min(1).max(300).optional(),
  body: z.string().trim().min(1).max(10_000),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ actionId: string }> },
) {
  const principal = await getRequestPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { actionId } = await context.params;
  if (!z.string().uuid().safeParse(actionId).success) {
    return NextResponse.json({ error: "Invalid action identifier." }, { status: 400 });
  }

  const parsed = revisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid subject and a reply between 1 and 10,000 characters." },
      { status: 400 },
    );
  }

  const correlationId = request.headers.get("x-correlation-id") ?? randomUUID();
  try {
    const action = await revisePersistedReply(
      principal,
      actionId,
      parsed.data,
      correlationId,
    );
    return NextResponse.json(
      { correlationId, action },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ActionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ApprovalTransitionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: 409 },
      );
    }
    throw error;
  }
}
