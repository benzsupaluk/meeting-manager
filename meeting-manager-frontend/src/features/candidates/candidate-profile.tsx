"use client";

import { ArrowLeft, CircleX, MessageSquarePlus, Pencil, RotateCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageSpinner } from "@/components/page-spinner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMeetingActions } from "@/features/meetings/use-meeting-actions";
import { formatMeetingRange, initials } from "@/lib/format";
import type { CandidateProfile as Profile, Meeting } from "@/lib/types";
import { useCandidateStore } from "@/stores/candidate-store";
import { FeedbackDialog } from "./feedback-dialog";
import { HistorySection } from "./history-section";
import { InterviewNotes } from "./interview-notes";
import { MeetingRow } from "./meeting-row";
import { Section } from "./section";

/** The meeting the header buttons act on: the one linked from the dashboard, else the next active one. */
function pickFocusedMeeting(profile: Profile, meetingId?: string): Meeting | undefined {
  const all = [...profile.upcomingMeetings, ...profile.pastMeetings];
  return (
    all.find((m) => m.id === meetingId) ??
    profile.upcomingMeetings.find((m) => m.status !== "cancelled") ??
    profile.upcomingMeetings[0]
  );
}

export function CandidateProfile({ candidateId, meetingId }: { candidateId: string; meetingId?: string }) {
  const profile = useCandidateStore((s) => s.profiles[candidateId]);
  const loading = useCandidateStore((s) => s.loadingId === candidateId);
  const error = useCandidateStore((s) => s.error);
  const fetchProfile = useCandidateStore((s) => s.fetchProfile);
  const actions = useMeetingActions();
  const [dialog, setDialog] = useState<"cancel" | "feedback" | null>(null);

  const refresh = useCallback(() => void fetchProfile(candidateId), [fetchProfile, candidateId]);
  useEffect(refresh, [refresh]);

  if (!profile) {
    return loading || !error ? (
      <PageSpinner label="Loading" />
    ) : (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card py-16 text-center">
        <p className="font-medium text-heading">Couldn&apos;t load candidate</p>
        <p className="text-sm">{error}</p>
        <Button variant="outline" onClick={refresh}>
          <RotateCw />
          Try again
        </Button>
      </div>
    );
  }

  const focused = pickFocusedMeeting(profile, meetingId);
  const canCancel = focused && (focused.status === "pending" || focused.status === "confirmed");

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard">
          <ArrowLeft />
          Back to meetings
        </Link>
      </Button>

      <header className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6 md:flex-row md:items-center">
        <Avatar className="size-16 rounded-2xl">
          <AvatarFallback className="rounded-2xl bg-primary text-xl font-semibold text-primary-foreground">
            {initials(profile.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-semibold">{profile.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              {profile.position}
            </Badge>
            {focused && (
              <span className="text-muted-foreground">
                {profile.upcomingMeetings.includes(focused) ? "Next" : "Selected"}:{" "}
                {formatMeetingRange(focused.startAt, focused.endAt)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {focused ? (
            <Button asChild variant="outline">
              <Link href={`/meetings/${focused.id}/edit`}>
                <Pencil />
                Edit Meeting
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              <Pencil />
              Edit Meeting
            </Button>
          )}
          <Button variant="destructive" disabled={!canCancel} onClick={() => setDialog("cancel")}>
            <CircleX />
            Cancel Meeting
          </Button>
          <Button onClick={() => setDialog("feedback")}>
            <MessageSquarePlus />
            Add Feedback
          </Button>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="min-w-0 space-y-4">
          <Section
            title="Meeting Info"
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/meetings/new">Schedule another</Link>
              </Button>
            }
          >
            {profile.upcomingMeetings.length === 0 ? (
              <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm">No upcoming meetings.</p>
            ) : (
              <ul className="space-y-3">
                {profile.upcomingMeetings.map((m) => (
                  <MeetingRow key={m.id} meeting={m} highlighted={m.id === focused?.id} onChanged={refresh} />
                ))}
              </ul>
            )}
          </Section>
          <InterviewNotes key={profile.updatedAt} candidateId={profile.id} notes={profile.interviewNotes} />
        </div>
        <HistorySection pastMeetings={profile.pastMeetings} feedback={profile.feedback} />
      </div>

      {focused && (
        <ConfirmDialog
          open={dialog === "cancel"}
          onOpenChange={(open) => !open && setDialog(null)}
          title="Cancel this meeting?"
          description={`${focused.title} · ${formatMeetingRange(focused.startAt, focused.endAt)} will be marked as cancelled.`}
          confirmLabel="Cancel meeting"
          destructive
          onConfirm={() => actions.cancel(focused).then(refresh)}
        />
      )}
      <FeedbackDialog
        candidateId={profile.id}
        meetings={[...profile.upcomingMeetings, ...profile.pastMeetings]}
        defaultMeetingId={focused?.id}
        open={dialog === "feedback"}
        onOpenChange={(open) => setDialog(open ? "feedback" : null)}
      />
    </div>
  );
}
