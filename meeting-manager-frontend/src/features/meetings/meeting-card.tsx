import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatMeetingRange, initials } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MeetingActionsMenu } from "./meeting-actions-menu";
import { MeetingLocation } from "./meeting-location";
import { StatusBadge } from "./status-badge";

export const MeetingCard = memo(function MeetingCard({ meeting }: { meeting: Meeting }) {
  const { candidate } = meeting;
  const inactive = meeting.status === "cancelled";
  const past = new Date(meeting.endAt).getTime() < Date.now();

  return (
    <Link
      href={`/candidates/${candidate.id}?meeting=${meeting.id}`}
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg hover:shadow-slate-200/70 cursor-pointer!",
        past && "border-slate-200 bg-slate-100 text-slate-500 grayscale",
        inactive && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-11">
          <AvatarFallback className="bg-accent font-semibold text-accent-foreground">
            {initials(candidate.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug">
            {candidate.name} <span className="font-normal text-muted-foreground">–</span>{" "}
            <span className="font-medium text-foreground">{candidate.position}</span>
          </h3>
          <p className="truncate text-sm text-muted-foreground">{meeting.title}</p>
        </div>
        <MeetingActionsMenu meeting={meeting} />
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm">
          <CalendarClock className="size-4 shrink-0 text-brand-ink" aria-hidden />
          <span className={cn(inactive && "line-through")}>
            {formatMeetingRange(meeting.startAt, meeting.endAt)}
          </span>
        </p>
        <MeetingLocation meeting={meeting} />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
        <StatusBadge status={meeting.status} />
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </div>
    </Link>
  );
});
