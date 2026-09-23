import { VexaDashboard } from "@/components/vexa-dashboard";
import { rankBriefingItems } from "@/lib/domain/ranking";
import { briefingItems, schedule } from "@/lib/fixtures/briefing";

export default function DemoPage() {
  return <VexaDashboard briefingItems={rankBriefingItems(briefingItems)} schedule={schedule} sourceMode="fixture" googleConnected={false} googleConfigured={false} />;
}
