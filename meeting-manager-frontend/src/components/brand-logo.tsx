import { CalendarCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <CalendarCheck2 className="size-5" />
      </span>
      {!compact && <span className="text-lg font-semibold tracking-tight text-heading">EggMeeting</span>}
    </div>
  );
}
