import { z } from "zod";

export const sourceCategorySchema = z.enum([
  "work",
  "social",
  "news",
  "protect",
]);

export const urgencySchema = z.enum(["critical", "high", "normal", "low"]);

export const citationSchema = z.object({
  id: z.string(),
  integration: z.string(),
  sourceType: z.string(),
  sourceLabel: z.string(),
  sourceUrl: z.string().url().optional(),
  observedAt: z.string().datetime(),
});

export const suggestedActionSchema = z.object({
  id: z.string(),
  kind: z.enum(["reply", "schedule", "publish", "review", "open"]),
  label: z.string(),
  destination: z.string(),
  status: z.enum([
    "recommended",
    "prepared",
    "awaiting_approval",
    "approved",
    "rejected",
    "executing",
    "succeeded",
    "failed",
  ]),
});

export const briefingItemSchema = z.object({
  id: z.string(),
  category: sourceCategorySchema,
  urgency: urgencySchema,
  title: z.string(),
  summary: z.string(),
  rationale: z.string(),
  dueLabel: z.string().optional(),
  citations: z.array(citationSchema).min(1),
  action: suggestedActionSchema.optional(),
});

export type SourceCategory = z.infer<typeof sourceCategorySchema>;
export type Urgency = z.infer<typeof urgencySchema>;
export type Citation = z.infer<typeof citationSchema>;
export type SuggestedAction = z.infer<typeof suggestedActionSchema>;
export type BriefingItem = z.infer<typeof briefingItemSchema>;

export const categoryLabels: Record<SourceCategory, string> = {
  work: "Work",
  social: "Social",
  news: "News",
  protect: "Protect",
};
