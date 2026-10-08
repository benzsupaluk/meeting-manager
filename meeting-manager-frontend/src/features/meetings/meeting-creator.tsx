import { UserRound } from "lucide-react";
import type { Meeting, MeetingCreator as Creator } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Meetings booked before creators were tracked belong to the seeded demo recruiter. */
const DEMO_RECRUITER: Omit<Creator, "id"> = {
  name: "Riley Recruiter",
  email: "recruiter@example.com",
};

export function MeetingCreator({
  meeting,
  className,
}: {
  meeting: Pick<Meeting, "createdBy">;
  className?: string;
}) {
  const creator = meeting.createdBy ?? DEMO_RECRUITER;
  return (
    <p className={cn("flex min-w-0 items-center gap-2 text-xs", className)}>
      <span className="shrink-0">Created by</span>
      <span className="truncate" title={creator.name}>
        {creator.email}
      </span>
    </p>
  );
}
