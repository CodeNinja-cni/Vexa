import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  ActionNotFoundError,
  transitionPersistedAction,
} from "@/lib/actions/persistence";
import { getRequestPrincipal } from "@/lib/auth/session";
import { ApprovalTransitionError } from "@/lib/domain/approvals";

const persistedTransitionSchema = z.object({
  command: z.enum([
    "prepare",
    "request_approval",
    "approve",
    "reject",
    "expire",
  ]),
  payload: z.record(z.string(), z.unknown()).optional(),
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

  const parsed = persistedTransitionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid transition request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const correlationId = request.headers.get("x-correlation-id") ?? randomUUID();

  try {
    const action = await transitionPersistedAction(
      principal,
      actionId,
      parsed.data.command,
      correlationId,
      parsed.data.payload,
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
