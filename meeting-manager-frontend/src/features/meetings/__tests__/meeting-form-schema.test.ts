import { describe, expect, it } from "vitest";
import { formValuesToPayload, MeetingFormSchema, type MeetingFormValues } from "../meeting-form-schema";

const valid: MeetingFormValues = {
  candidateName: "Alice",
  position: "Software Engineer",
  date: new Date(2030, 0, 1),
  startTime: "10:00",
  endTime: "11:00",
  type: "zoom",
  location: "https://zoom.us/j/1",
  status: "pending",
  description: "",
  title: "",
};

const issuesFor = (values: Partial<MeetingFormValues>) => {
  const result = MeetingFormSchema.safeParse({ ...valid, ...values });
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

describe("MeetingFormSchema", () => {
  it("accepts a valid booking", () => {
    expect(issuesFor({})).toEqual([]);
  });

  it("requires end time after start time", () => {
    expect(issuesFor({ endTime: "09:00" })).toContain("endTime");
  });

  it("requires a URL for online meetings but free text for onsite", () => {
    expect(issuesFor({ location: "Room A" })).toContain("location");
    expect(issuesFor({ type: "onsite", location: "Room A" })).toEqual([]);
  });
});

describe("formValuesToPayload", () => {
  it("sends candidateId when a candidate was picked", () => {
    const payload = formValuesToPayload({ ...valid, candidateId: "c1" });
    expect(payload).toMatchObject({ candidateId: "c1" });
    expect(payload).not.toHaveProperty("candidateName");
  });

  it("sends name + position for a new candidate and omits empty title", () => {
    const payload = formValuesToPayload(valid);
    expect(payload).toMatchObject({ candidateName: "Alice", position: "Software Engineer", title: undefined });
    expect(new Date(payload.endAt).getTime() - new Date(payload.startAt).getTime()).toBe(3_600_000);
  });
});
