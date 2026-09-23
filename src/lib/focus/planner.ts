import {
  focusPlanResponseSchema,
  type FocusEvent,
  type FocusPlanResponse,
  type FocusProposal,
  type FocusWindow,
} from "@/lib/focus/contracts";

export interface FocusSourceEvent {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  sourceUrl?: string;
  cancelled?: boolean;
}

interface PlanOptions {
  now: Date;
  dayStart: Date;
  dayEnd: Date;
  timeZone: string;
  mode: "live" | "fixture";
  completenessWarning?: string;
  bufferMinutes?: number;
  minimumFocusMinutes?: number;
}

interface Interval {
  start: Date;
  end: Date;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function datePartsInZone(value: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: string) => Number(parts.find((candidate) => candidate.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}

function wallTimeInZone(
  reference: Date,
  timeZone: string,
  hour: number,
  minute: number,
): Date {
  const { year, month, day } = datePartsInZone(reference, timeZone);
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const guess = new Date(wallAsUtc);
  const zoneParts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(guess);
  const zonePart = (type: string) => Number(zoneParts.find((candidate) => candidate.type === type)?.value);
  const renderedAsUtc = Date.UTC(
    zonePart("year"),
    zonePart("month") - 1,
    zonePart("day"),
    zonePart("hour"),
    zonePart("minute"),
  );
  return new Date(wallAsUtc - (renderedAsUtc - guess.getTime()));
}

export function workdayBounds(
  now: Date,
  timeZone: string,
): { dayStart: Date; dayEnd: Date } {
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  });
  for (let offset = 0; offset < 8; offset += 1) {
    const reference = new Date(now.getTime() + offset * 86_400_000);
    const weekday = weekdayFormatter.format(reference);
    if (weekday === "Sat" || weekday === "Sun") continue;
    const dayStart = wallTimeInZone(reference, timeZone, 9, 0);
    const dayEnd = wallTimeInZone(reference, timeZone, 17, 30);
    if (offset === 0 && now.getTime() >= dayEnd.getTime()) continue;
    return { dayStart, dayEnd };
  }
  throw new Error("Unable to resolve the next workday.");
}

function minutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

function addMinutes(value: Date, minutes: number): Date {
  return new Date(value.getTime() + minutes * 60_000);
}

function roundUpToFiveMinutes(value: Date): Date {
  const rounded = new Date(value);
  rounded.setUTCSeconds(0, 0);
  const remainder = rounded.getUTCMinutes() % 5;
  if (remainder) rounded.setUTCMinutes(rounded.getUTCMinutes() + (5 - remainder));
  return rounded;
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  const ordered = [...intervals].sort((left, right) => left.start.getTime() - right.start.getTime());
  const merged: Interval[] = [];
  for (const interval of ordered) {
    const previous = merged.at(-1);
    if (!previous || interval.start.getTime() > previous.end.getTime()) {
      merged.push({ start: interval.start, end: interval.end });
    } else if (interval.end.getTime() > previous.end.getTime()) {
      previous.end = interval.end;
    }
  }
  return merged;
}

function windowReason(durationMinutes: number): string {
  if (durationMinutes >= 90) return "Long uninterrupted window suitable for high-context deep work.";
  if (durationMinutes >= 60) return "Protected hour with enough room to complete one meaningful outcome.";
  return "Usable focus window after preserving recovery time around meetings.";
}

export function planFocusDay(
  sourceEvents: FocusSourceEvent[],
  options: PlanOptions,
): FocusPlanResponse {
  const bufferMinutes = options.bufferMinutes ?? 10;
  const minimumFocusMinutes = options.minimumFocusMinutes ?? 45;
  const valid = sourceEvents
    .filter((event) =>
      !event.cancelled &&
      event.endAt.getTime() > event.startAt.getTime() &&
      event.endAt.getTime() > options.dayStart.getTime() &&
      event.startAt.getTime() < options.dayEnd.getTime(),
    )
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime());

  const conflicts = new Set<string>();
  for (let index = 0; index < valid.length; index += 1) {
    for (let other = index + 1; other < valid.length; other += 1) {
      if (valid[other].startAt.getTime() >= valid[index].endAt.getTime()) break;
      conflicts.add(valid[index].id);
      conflicts.add(valid[other].id);
    }
  }

  const events: FocusEvent[] = valid.map((event) => ({
    id: event.id,
    title: event.title,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    durationMinutes: minutesBetween(event.startAt, event.endAt),
    location: event.location,
    sourceUrl: event.sourceUrl,
    conflict: conflicts.has(event.id),
  }));

  const clippedBusy = mergeIntervals(valid.map((event) => ({
    start: new Date(Math.max(options.dayStart.getTime(), event.startAt.getTime())),
    end: new Date(Math.min(options.dayEnd.getTime(), event.endAt.getTime())),
  })));
  const busyMinutes = clippedBusy.reduce(
    (total, interval) => total + minutesBetween(interval.start, interval.end),
    0,
  );

  const planningStart = options.now.getTime() > options.dayStart.getTime() &&
    options.now.getTime() < options.dayEnd.getTime()
    ? roundUpToFiveMinutes(options.now)
    : options.dayStart;
  const bufferedBusy = mergeIntervals(valid
    .map((event) => ({
      start: new Date(Math.max(planningStart.getTime(), addMinutes(event.startAt, -bufferMinutes).getTime())),
      end: new Date(Math.min(options.dayEnd.getTime(), addMinutes(event.endAt, bufferMinutes).getTime())),
    }))
    .filter((interval) => interval.end.getTime() > planningStart.getTime()));

  const rawWindows: Interval[] = [];
  let cursor = planningStart;
  for (const interval of bufferedBusy) {
    if (interval.start.getTime() > cursor.getTime()) {
      rawWindows.push({ start: cursor, end: interval.start });
    }
    if (interval.end.getTime() > cursor.getTime()) cursor = interval.end;
  }
  if (cursor.getTime() < options.dayEnd.getTime()) {
    rawWindows.push({ start: cursor, end: options.dayEnd });
  }

  const viableWindows = rawWindows.filter(
    (window) => minutesBetween(window.start, window.end) >= 15,
  );
  const recommendedIds = new Set(
    [...viableWindows]
      .filter((window) => minutesBetween(window.start, window.end) >= minimumFocusMinutes)
      .sort((left, right) =>
        minutesBetween(right.start, right.end) - minutesBetween(left.start, left.end) ||
        left.start.getTime() - right.start.getTime(),
      )
      .slice(0, 2)
      .map((window) => `${window.start.toISOString()}-${window.end.toISOString()}`),
  );
  const freeWindows: FocusWindow[] = viableWindows.map((window, index) => {
    const durationMinutes = minutesBetween(window.start, window.end);
    const id = `${window.start.toISOString()}-${window.end.toISOString()}`;
    return {
      id: `window-${index + 1}`,
      startAt: window.start.toISOString(),
      endAt: window.end.toISOString(),
      durationMinutes,
      recommended: recommendedIds.has(id),
      reason: windowReason(durationMinutes),
    };
  });

  const proposals: FocusProposal[] = freeWindows
    .filter((window) => window.recommended)
    .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
    .map((window, index) => {
      const durationMinutes = Math.min(
        90,
        Math.max(minimumFocusMinutes, Math.floor(window.durationMinutes / 15) * 15),
      );
      return {
        id: `focus-proposal-${index + 1}`,
        title: index === 0 ? "Resolve highest-impact work" : "Deep work block",
        startAt: window.startAt,
        endAt: addMinutes(new Date(window.startAt), durationMinutes).toISOString(),
        durationMinutes,
        reason: window.reason,
        status: "proposed" as const,
      };
    });

  const freeMinutes = freeWindows.reduce((total, window) => total + window.durationMinutes, 0);
  const dayMinutes = Math.max(1, minutesBetween(options.dayStart, options.dayEnd));
  const score = Math.max(
    0,
    Math.min(100, Math.round(40 + (freeMinutes / dayMinutes) * 55 - conflicts.size * 6)),
  );
  const health = score >= 70 ? "healthy" as const : score >= 45 ? "tight" as const : "overloaded" as const;
  const explanation = health === "healthy"
    ? `Your calendar has room for ${proposals.length} protected focus ${proposals.length === 1 ? "block" : "blocks"} after meeting buffers.`
    : health === "tight"
      ? "Your remaining calendar is fragmented, so Vexa selected only windows long enough for meaningful progress."
      : "Your calendar is heavily constrained or conflicting; resolve meetings before protecting deep work.";

  return focusPlanResponseSchema.parse({
    mode: options.mode,
    generatedAt: options.now.toISOString(),
    timeZone: options.timeZone,
    dayStart: options.dayStart.toISOString(),
    dayEnd: options.dayEnd.toISOString(),
    score,
    health,
    explanation,
    completenessWarning: options.completenessWarning,
    summary: {
      meetings: events.length,
      busyMinutes,
      freeMinutes,
      focusBlocks: proposals.length,
      conflicts: conflicts.size,
    },
    events,
    freeWindows,
    proposals,
  });
}
