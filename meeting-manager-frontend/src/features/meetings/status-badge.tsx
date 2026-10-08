import { Badge } from "@/components/ui/badge";
import { MEETING_STATUS_LABEL } from "@/lib/constants";
import type { MeetingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<MeetingStatus, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: MeetingStatus; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("gap-1.5 font-medium", STYLES[status], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {MEETING_STATUS_LABEL[status]}
    </Badge>
  );
}
