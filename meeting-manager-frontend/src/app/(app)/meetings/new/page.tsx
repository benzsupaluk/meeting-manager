import type { Metadata } from "next";
import { FormCard } from "@/components/form-card";
import { GuestRedirect, MembersOnly } from "@/features/auth/members-only";
import { MeetingForm } from "@/features/meetings/meeting-form";
import type { CandidateSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Schedule a New Meeting" };

export default async function NewMeetingPage({ searchParams }: PageProps<"/meetings/new">) {
  const { candidateId, candidateName, position } = await searchParams;
  // Prefilled when coming from a candidate profile ("Schedule another").
  const candidate: CandidateSummary | undefined =
    typeof candidateId === "string" && typeof candidateName === "string"
      ? { id: candidateId, name: candidateName, position: typeof position === "string" ? position : "" }
      : undefined;

  return (
    <MembersOnly fallback={<GuestRedirect to="/dashboard" message="Guests can't schedule meetings." />}>
      <FormCard title="Schedule a New Meeting" description="Book an interview slot with a candidate.">
        <MeetingForm candidate={candidate} />
      </FormCard>
    </MembersOnly>
  );
}
