import { describe, expect, it } from "vitest";

import { briefingItems } from "@/lib/fixtures/briefing";
import { rankBriefingItems } from "@/lib/domain/ranking";

describe("rankBriefingItems", () => {
  it("places high-urgency evidence-backed work first", () => {
    const ranked = rankBriefingItems(briefingItems);

    expect(ranked[0].id).toBe("brief-1");
    expect(ranked[0].citations).toHaveLength(2);
  });

  it("does not mutate the input array", () => {
    const input = [...briefingItems].reverse();
    const originalOrder = input.map((item) => item.id);

    rankBriefingItems(input);

    expect(input.map((item) => item.id)).toEqual(originalOrder);
  });
});
