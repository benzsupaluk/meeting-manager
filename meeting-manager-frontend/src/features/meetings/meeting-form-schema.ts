import { z } from "zod";
import { combineDateAndTime, isOnline, toTimeInput } from "@/lib/format";
import type { Meeting, MeetingPayload } from "@/lib/types";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MeetingFormSchema = z
  .object({
    candidateId: z.string().optional(),
    candidateName: z.string().trim().min(1, "Candidate name is required").max(120),
    position: z.string().min(1, "Select a position"),
    title: z.string().trim().max(200).optional(),
    date: z.date({ error: "Pick a date" }),
    startTime: z.string().regex(TIME, "Pick a start time"),
    endTime: z.string().regex(TIME, "Pick an end time"),
    type: z.enum(["onsite", "zoom", "google_meet"]),
    location: z.string().trim().max(500).optional(),
    status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
    description: z.string().max(5000).optional(),
  })
  .refine((v) => v.endTime > v.startTime, { message: "End time must be after start time", path: ["endTime"] })
  .refine((v) => !isOnline(v.type) || !v.location || z.url().safeParse(v.location).success, {
    message: "Enter a valid meeting link (https://…)",
    path: ["location"],
  });

export type MeetingFormValues = z.infer<typeof MeetingFormSchema>;

export function defaultMeetingFormValues(): MeetingFormValues {
  return {
    candidateName: "",
    position: "",
    title: "",
    date: undefined as unknown as Date, // forces the user to pick; validated by the schema
    startTime: "10:00",
    endTime: "11:00",
    type: "zoom",
    location: "",
    status: "pending",
    description: "",
  };
}

export function meetingToFormValues(m: Meeting): MeetingFormValues {
  return {
    candidateId: m.candidate.id,
    candidateName: m.candidate.name,
    position: m.candidate.position,
    title: m.title,
    date: new Date(m.startAt),
    startTime: toTimeInput(m.startAt),
    endTime: toTimeInput(m.endAt),
    type: m.type,
    location: m.location,
    status: m.status,
    description: m.description,
  };
}

export function formValuesToPayload(v: MeetingFormValues): MeetingPayload {
  return {
    // A selected candidate id wins; otherwise the API finds-or-creates by name + position.
    ...(v.candidateId ? { candidateId: v.candidateId } : { candidateName: v.candidateName, position: v.position }),
    title: v.title || undefined,
    description: v.description ?? "",
    startAt: combineDateAndTime(v.date, v.startTime),
    endAt: combineDateAndTime(v.date, v.endTime),
    type: v.type,
    location: v.location ?? "",
    status: v.status,
  };
}
