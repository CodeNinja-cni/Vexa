import { z } from "zod";

export const focusEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  location: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  conflict: z.boolean(),
});

export const focusWindowSchema = z.object({
  id: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  recommended: z.boolean(),
  reason: z.string(),
});

export const focusProposalSchema = z.object({
  id: z.string(),
  title: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  reason: z.string(),
  status: z.literal("proposed"),
});

export const focusPlanResponseSchema = z.object({
  mode: z.enum(["live", "fixture"]),
  generatedAt: z.string().datetime(),
  timeZone: z.string(),
  dayStart: z.string().datetime(),
  dayEnd: z.string().datetime(),
  score: z.number().int().min(0).max(100),
  health: z.enum(["healthy", "tight", "overloaded"]),
  explanation: z.string(),
  completenessWarning: z.string().optional(),
  summary: z.object({
    meetings: z.number().int().nonnegative(),
    busyMinutes: z.number().int().nonnegative(),
    freeMinutes: z.number().int().nonnegative(),
    focusBlocks: z.number().int().nonnegative(),
    conflicts: z.number().int().nonnegative(),
  }),
  events: z.array(focusEventSchema),
  freeWindows: z.array(focusWindowSchema),
  proposals: z.array(focusProposalSchema),
});

export type FocusEvent = z.infer<typeof focusEventSchema>;
export type FocusWindow = z.infer<typeof focusWindowSchema>;
export type FocusProposal = z.infer<typeof focusProposalSchema>;
export type FocusPlanResponse = z.infer<typeof focusPlanResponseSchema>;
