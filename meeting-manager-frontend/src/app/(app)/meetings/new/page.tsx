import type { Metadata } from "next";
import { FormCard } from "@/components/form-card";
import { MeetingForm } from "@/features/meetings/meeting-form";

export const metadata: Metadata = { title: "Schedule a New Meeting" };

export default function NewMeetingPage() {
  return (
    <FormCard title="Schedule a New Meeting" description="Book an interview slot with a candidate.">
      <MeetingForm />
    </FormCard>
  );
}
