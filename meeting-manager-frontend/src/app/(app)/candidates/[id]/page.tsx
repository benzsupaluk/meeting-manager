import type { Metadata } from "next";
import { CandidateProfile } from "@/features/candidates/candidate-profile";

export const metadata: Metadata = { title: "Candidate Summary" };

export default async function CandidatePage({ params, searchParams }: PageProps<"/candidates/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const meetingId = typeof query.meeting === "string" ? query.meeting : undefined;
  return <CandidateProfile candidateId={id} meetingId={meetingId} />;
}
