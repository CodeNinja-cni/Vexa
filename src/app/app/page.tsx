import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isGoogleOAuthConfigured } from "@/lib/auth/config";
import { getLiveDashboardData } from "@/lib/briefing/live";
import { VexaDashboard } from "@/components/vexa-dashboard";
import { hasConnectedGoogleIntegration } from "@/lib/connectors/google/status";
import {
  getPrincipalForSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { rankBriefingItems } from "@/lib/domain/ranking";
import { briefingItems, schedule } from "@/lib/fixtures/briefing";

export default async function WorkspacePage() {
  const sessionToken = (await cookies()).get(SESSION_COOKIE)?.value;
  const principal = sessionToken
    ? await getPrincipalForSessionToken(sessionToken)
    : null;
  if (!principal) redirect("/login?next=/app");

  const [live, googleConnected] = await Promise.all([
    getLiveDashboardData(principal),
    hasConnectedGoogleIntegration(principal),
  ]);
  const useLiveData = live.recordCount > 0;
  return <VexaDashboard briefingItems={useLiveData ? live.briefingItems : rankBriefingItems(briefingItems)} schedule={live.schedule.length ? live.schedule : schedule} sourceMode={useLiveData ? "live" : "fixture"} googleConnected={googleConnected} googleConfigured={isGoogleOAuthConfigured()} viewer={{ displayName: principal.displayName, organizationName: principal.organizationName }} />;
}
