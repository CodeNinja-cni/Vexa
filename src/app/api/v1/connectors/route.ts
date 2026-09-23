import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { getRequestPrincipal } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { integrations } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const principal = await getRequestPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const connections = await getDatabase()
    .select({
      provider: integrations.provider,
      status: integrations.status,
      capabilities: integrations.capabilities,
      isFixture: integrations.isFixture,
      lastSynchronizedAt: integrations.lastSynchronizedAt,
    })
    .from(integrations)
    .where(
      and(
        eq(integrations.organizationId, principal.organizationId),
        eq(integrations.ownerUserId, principal.userId),
      ),
    );

  return NextResponse.json(
    {
      connections: connections.map((connection) => ({
        ...connection,
        lastSynchronizedAt: connection.lastSynchronizedAt?.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
