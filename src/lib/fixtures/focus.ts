import { planFocusDay, workdayBounds } from "@/lib/focus/planner";
import type { FocusPlanResponse } from "@/lib/focus/contracts";

function at(dayStart: Date, minutes: number): Date {
  return new Date(dayStart.getTime() + minutes * 60_000);
}

export function getDemoFocusPlan(
  now = new Date("2026-09-20T12:00:00.000Z"),
): FocusPlanResponse {
  const timeZone = "Africa/Lagos";
  const { dayStart, dayEnd } = workdayBounds(now, timeZone);
  return planFocusDay(
    [
      {
        id: "demo-calendar-standup",
        title: "Engineering stand-up",
        startAt: at(dayStart, 60),
        endAt: at(dayStart, 85),
        location: "Google Meet · demo",
      },
      {
        id: "demo-calendar-design",
        title: "Design handoff",
        startAt: at(dayStart, 210),
        endAt: at(dayStart, 255),
        location: "Figma review · demo",
      },
      {
        id: "demo-calendar-launch",
        title: "Vexa launch review",
        startAt: at(dayStart, 300),
        endAt: at(dayStart, 360),
        location: "Google Meet · demo",
      },
    ],
    {
      now,
      dayStart,
      dayEnd,
      timeZone,
      mode: "fixture",
      completenessWarning:
        "Demonstration focus plan. Connect and sync Google Calendar to calculate availability from your authorized events.",
    },
  );
}
