import type { MeetingStatus, MeetingType } from "./types";

export const APP_NAME = "Candidate Meeting Scheduler";

export const POSITIONS = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "QA Engineer",
  "Product Designer",
  "Product Manager",
  "Data Engineer",
] as const;

export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const MEETING_TYPE_LABEL: Record<MeetingType, string> = {
  onsite: "Onsite",
  zoom: "Zoom",
  google_meet: "Google Meet",
};

export const PAGE_SIZE = 8;
