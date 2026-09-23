import type { BriefingItem, Urgency } from "@/lib/domain/models";

const urgencyWeight: Record<Urgency, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export function rankBriefingItems(items: BriefingItem[]): BriefingItem[] {
  return [...items].sort((left, right) => {
    const urgencyDifference =
      urgencyWeight[right.urgency] - urgencyWeight[left.urgency];

    if (urgencyDifference !== 0) return urgencyDifference;

    return right.citations.length - left.citations.length;
  });
}
