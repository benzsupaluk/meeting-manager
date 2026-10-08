import { Building2, Video } from "lucide-react";
import { MEETING_TYPE_LABEL } from "@/lib/constants";
import { isOnline } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MeetingLocation({ meeting, className }: { meeting: Pick<Meeting, "type" | "location">; className?: string }) {
  const online = isOnline(meeting.type);
  const Icon = online ? Video : Building2;
  const isLink = online && /^https?:\/\//.test(meeting.location);

  return (
    <span className={cn("flex min-w-0 items-center gap-2 text-sm", className)}>
      <Icon className="size-4 shrink-0 text-brand-ink" aria-hidden />
      <span className="shrink-0">{MEETING_TYPE_LABEL[meeting.type]}</span>
      {meeting.location && (
        <>
          <span aria-hidden>·</span>
          {isLink ? (
            <a
              href={meeting.location}
              target="_blank"
              rel="noreferrer"
              className="truncate text-brand-ink hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Join link
            </a>
          ) : (
            <span className="truncate">{meeting.location}</span>
          )}
        </>
      )}
    </span>
  );
}
