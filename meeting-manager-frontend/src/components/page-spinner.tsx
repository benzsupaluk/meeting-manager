import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageSpinner({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-24", className)}>
      <Loader2 className="size-6 animate-spin text-brand-ink" aria-label={label} />
    </div>
  );
}
