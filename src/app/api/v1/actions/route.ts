import { NextResponse, type NextRequest } from "next/server";

import { getActionCenter } from "@/lib/actions/read-model";
import { getRequestPrincipal } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const principal = await getRequestPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  return NextResponse.json(await getActionCenter(principal), {
    headers: { "Cache-Control": "no-store" },
  });
}
