import { describe, expect, it } from "vitest";
import { combineDateAndTime, formatMeetingRange, initials, toTimeInput } from "../format";

describe("format helpers", () => {
  it("formats a same-day meeting range", () => {
    const start = new Date(2025, 9, 12, 10, 0).toISOString();
    const end = new Date(2025, 9, 12, 11, 0).toISOString();
    expect(formatMeetingRange(start, end)).toBe("Oct 12, 2025 · 10:00 AM – 11:00 AM");
  });

  it("includes the end date when a meeting spans days", () => {
    const start = new Date(2025, 9, 12, 23, 0).toISOString();
    const end = new Date(2025, 9, 13, 0, 30).toISOString();
    expect(formatMeetingRange(start, end)).toBe("Oct 12, 2025 · 11:00 PM – Oct 13, 2025 12:30 AM");
  });

  it("combines a date and HH:mm in local time and round-trips", () => {
    const iso = combineDateAndTime(new Date(2025, 0, 5), "14:30");
    expect(toTimeInput(iso)).toBe("14:30");
    expect(new Date(iso).getDate()).toBe(5);
  });

  it("builds initials from up to two words", () => {
    expect(initials("alice  marie johnson")).toBe("AM");
    expect(initials("Bob")).toBe("B");
  });
});
