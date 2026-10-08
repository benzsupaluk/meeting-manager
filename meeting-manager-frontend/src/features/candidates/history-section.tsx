import { CalendarCheck, MessageSquareText, Star } from "lucide-react";
import { formatDate, formatMeetingRange } from "@/lib/format";
import type { Feedback, Meeting } from "@/lib/types";
import { MeetingCreator } from "@/features/meetings/meeting-creator";
import { StatusBadge } from "@/features/meetings/status-badge";
import { Section } from "./section";

type Entry = { kind: "meeting"; at: string; meeting: Meeting } | { kind: "feedback"; at: string; feedback: Feedback };

export function HistorySection({ pastMeetings, feedback }: { pastMeetings: Meeting[]; feedback: Feedback[] }) {
  const entries: Entry[] = [
    ...pastMeetings.map((meeting) => ({ kind: "meeting" as const, at: meeting.startAt, meeting })),
    ...feedback.map((fb) => ({ kind: "feedback" as const, at: fb.createdAt, feedback: fb })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <Section title="History">
      {entries.length === 0 ? (
        <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm">No previous interviews or evaluations yet.</p>
      ) : (
        <ol className="relative space-y-5 border-l pl-6">
          {entries.map((entry) =>
            entry.kind === "meeting" ? (
              <li key={`m-${entry.meeting.id}`} className="relative">
                <TimelineIcon>
                  <CalendarCheck className="size-3.5" />
                </TimelineIcon>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-heading">{entry.meeting.title}</p>
                  <StatusBadge status={entry.meeting.status} />
                </div>
                <p className="text-sm">{formatMeetingRange(entry.meeting.startAt, entry.meeting.endAt)}</p>
                <MeetingCreator meeting={entry.meeting} />
                {entry.meeting.description && <p className="text-sm text-muted-foreground">{entry.meeting.description}</p>}
              </li>
            ) : (
              <li key={`f-${entry.feedback.id}`} className="relative">
                <TimelineIcon>
                  <MessageSquareText className="size-3.5" />
                </TimelineIcon>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-heading">Feedback from {entry.feedback.authorName}</p>
                  <span className="flex" aria-label={`${entry.feedback.rating} out of 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={i < entry.feedback.rating ? "size-3.5 fill-warning text-warning" : "size-3.5 text-muted-foreground/30"}
                      />
                    ))}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(entry.feedback.createdAt)}</p>
                <p className="mt-1 text-sm whitespace-pre-line">{entry.feedback.comment}</p>
              </li>
            ),
          )}
        </ol>
      )}
    </Section>
  );
}

function TimelineIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute top-0.5 -left-[35px] flex size-6 items-center justify-center rounded-full border bg-card text-brand-ink">
      {children}
    </span>
  );
}
