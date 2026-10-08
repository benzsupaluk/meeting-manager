import { MEETING_STATUS_LABEL } from "@/lib/constants";
import type { MeetingStatus } from "@/lib/types";

const DOT: Record<MeetingStatus, string> = {
  confirmed: "bg-success",
  pending: "bg-warning",
  cancelled: "bg-destructive",
  completed: "bg-muted-foreground",
};

const HINT: Record<MeetingStatus, string> = {
  confirmed: "Candidate accepted the slot",
  pending: "Awaiting candidate confirmation",
  cancelled: "Will not take place",
  completed: "Interview finished",
};

export function StatusLegend() {
  return (
    <section className="rounded-2xl border bg-card p-5" aria-labelledby="legend-heading">
      <h2 id="legend-heading" className="mb-3 text-lg font-semibold">
        Meeting Status
      </h2>
      <ul className="space-y-2.5">
        {(Object.keys(MEETING_STATUS_LABEL) as MeetingStatus[]).map((status) => (
          <li key={status} className="flex items-center gap-3 text-sm">
            <span className={`size-2.5 rounded-full ${DOT[status]}`} aria-hidden />
            <span className="font-medium text-heading">{MEETING_STATUS_LABEL[status]}</span>
            <span className="truncate text-xs text-muted-foreground">{HINT[status]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
