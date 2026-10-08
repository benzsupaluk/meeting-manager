import { CalendarClock } from "lucide-react";
import { MeetingActionsMenu } from "@/features/meetings/meeting-actions-menu";
import { MeetingCreator } from "@/features/meetings/meeting-creator";
import { MeetingLocation } from "@/features/meetings/meeting-location";
import { StatusBadge } from "@/features/meetings/status-badge";
import { formatMeetingRange } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MeetingRow({ meeting, highlighted, onChanged }: { meeting: Meeting; highlighted?: boolean; onChanged: () => void }) {
  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-4",
        highlighted && "border-primary/40 bg-accent/50",
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="font-medium text-heading">{meeting.title}</p>
        <p className="flex items-center gap-2 text-sm">
          <CalendarClock className="size-4 shrink-0 text-brand-ink" aria-hidden />
          {formatMeetingRange(meeting.startAt, meeting.endAt)}
        </p>
        <MeetingLocation meeting={meeting} />
        <MeetingCreator meeting={meeting} />
        {meeting.description && <p className="text-sm text-muted-foreground">{meeting.description}</p>}
      </div>
      <div className="flex items-center gap-2 self-start sm:self-center">
        <StatusBadge status={meeting.status} />
        <MeetingActionsMenu meeting={meeting} onChanged={onChanged} />
      </div>
    </li>
  );
}
