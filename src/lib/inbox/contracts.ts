import { z } from "zod";

export const inboxCategorySchema = z.enum([
  "priority",
  "waiting",
  "opportunity",
  "fyi",
]);

export const inboxItemSchema = z.object({
  id: z.string(),
  channel: z.string(),
  senderName: z.string(),
  senderEmail: z.string(),
  initials: z.string(),
  subject: z.string(),
  preview: z.string(),
  occurredAt: z.string().datetime(),
  unread: z.boolean(),
  category: inboxCategorySchema,
  priorityScore: z.number().int().min(0).max(100),
  reason: z.string(),
  sourceUrl: z.string().url().optional(),
});

export const inboxResponseSchema = z.object({
  mode: z.enum(["live", "fixture"]),
  generatedAt: z.string().datetime(),
  completenessWarning: z.string().optional(),
  items: z.array(inboxItemSchema),
  summary: z.object({
    total: z.number().int().nonnegative(),
    priority: z.number().int().nonnegative(),
    waiting: z.number().int().nonnegative(),
    opportunity: z.number().int().nonnegative(),
    fyi: z.number().int().nonnegative(),
  }),
});

export type InboxCategory = z.infer<typeof inboxCategorySchema>;
export type InboxItem = z.infer<typeof inboxItemSchema>;
export type InboxResponse = z.infer<typeof inboxResponseSchema>;

export function summarizeInbox(items: InboxItem[]): InboxResponse["summary"] {
  return {
    total: items.length,
    priority: items.filter((item) => item.category === "priority").length,
    waiting: items.filter((item) => item.category === "waiting").length,
    opportunity: items.filter((item) => item.category === "opportunity").length,
    fyi: items.filter((item) => item.category === "fyi").length,
  };
}
