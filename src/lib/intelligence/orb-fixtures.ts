import { briefingItems } from "@/lib/fixtures/briefing";
import type { OrbEvidenceRecord } from "@/lib/intelligence/orb";

export function getFixtureOrbEvidence(): OrbEvidenceRecord[] {
  return briefingItems.flatMap((item) =>
    item.citations.map((citation) => ({
      id: `${item.id}-${citation.id}`,
      integration: citation.integration,
      sourceType: citation.sourceType,
      title: citation.sourceLabel,
      body: `${item.summary} ${item.rationale}`,
      sourceUrl: citation.sourceUrl,
      occurredAt: new Date(citation.observedAt),
      metadata: {
        category: item.category,
        urgency: item.urgency,
        dueLabel: item.dueLabel ?? "",
      },
    })),
  );
}
