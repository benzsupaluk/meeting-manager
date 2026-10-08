import type { Metadata } from "next";
import { FormCard } from "@/components/form-card";
import { GuestNotice, MembersOnly } from "@/features/auth/members-only";
import { MeetingForm } from "@/features/meetings/meeting-form";

export const metadata: Metadata = { title: "Schedule a New Meeting" };

export default function NewMeetingPage() {
  return (
    <FormCard title="Schedule a New Meeting" description="Book an interview slot with a candidate.">
      <MembersOnly fallback={<GuestNotice message="Guests can view and join meetings, but can't schedule new ones. Log in with an account to book an interview." />}>
        <MeetingForm />
      </MembersOnly>
    </FormCard>
  );
}
