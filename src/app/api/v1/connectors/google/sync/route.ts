import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getRequestPrincipal } from "@/lib/auth/session";
import { synchronizeGoogleWorkspace } from "@/lib/connectors/google/sync";

export async function POST(request: NextRequest) {
  const principal = await getRequestPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const correlationId = request.headers.get("x-correlation-id") ?? randomUUID();

  try {
    const connectors = await synchronizeGoogleWorkspace(principal, correlationId);
    const failed = connectors.some((connector) => connector.status === "failed");

    return NextResponse.json(
      {
        status: failed ? "degraded" : "connected",
        correlationId,
        synchronizedAt: new Date().toISOString(),
        connectors,
      },
      {
        status: failed ? 207 : 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google sync failed.";
    return NextResponse.json(
      { error: message, correlationId },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
