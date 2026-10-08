import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatMeetingRange, initials } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MeetingActionsMenu } from "./meeting-actions-menu";
import { MeetingCreator } from "./meeting-creator";
import { MeetingLocation } from "./meeting-location";
import { StatusBadge } from "./status-badge";
import { useRouter } from "next/navigation";

const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, label, [role="button"], [role="menuitem"], [role="link"]';

export const MeetingCard = memo(function MeetingCard({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  const { candidate } = meeting;
  const inactive = meeting.status === "cancelled";
  const past = new Date(meeting.endAt).getTime() < Date.now();
  const detailsHref = `/candidates/${candidate.id}?meeting=${meeting.id}`;

  return (
    <article
      onClick={(e) => {
        const target = e.target as HTMLElement;
        // Portaled content (actions menu, dialogs) still bubbles through React — ignore it.
        if (!e.currentTarget.contains(target)) return;
        // Let buttons, links and other controls inside the card handle their own clicks.
        if (target.closest(INTERACTIVE_SELECTOR)) return;
        router.push(detailsHref);
      }}
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
            {candidate.name} <span className="font-normal text-muted-foreground">|</span>{" "}
            <span className="font-medium text-foreground">{candidate.position}</span>
          </h3>
          <p className="truncate text-sm text-muted-foreground">{meeting.title}</p>
        </div>
        <MeetingActionsMenu meeting={meeting} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2 text-sm">
            <CalendarClock className="size-4 shrink-0 text-brand-ink" aria-hidden />
            <span className={cn(inactive && "line-through")}>
              {formatMeetingRange(meeting.startAt, meeting.endAt)}
            </span>
          </p>
          <MeetingLocation meeting={meeting} />
        </div>
        <MeetingCreator meeting={meeting} />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
        <StatusBadge status={meeting.status} />
        <Button asChild variant="outline" size="sm">
          <Link href={detailsHref}>View Details</Link>
        </Button>
      </div>
    </article>
  );
});
