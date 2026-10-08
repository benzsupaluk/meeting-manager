"use client";

import { CircleCheck, CircleX, EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMeetingRange } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import { useIsGuest } from "@/stores/auth-store";
import { useMeetingActions } from "./use-meeting-actions";

interface Props {
  meeting: Meeting;
  /** Called after a successful mutation, e.g. to refresh a candidate profile. */
  onChanged?: () => void;
}

export function MeetingActionsMenu({ meeting, onChanged }: Props) {
  const actions = useMeetingActions();
  const isGuest = useIsGuest();
  const [dialog, setDialog] = useState<"cancel" | "delete" | null>(null);
  const closed = meeting.status === "cancelled" || meeting.status === "completed";
  const summary = `${meeting.candidate.name} · ${formatMeetingRange(meeting.startAt, meeting.endAt)}`;

  if (isGuest) return null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for meeting with ${meeting.candidate.name}`}
          >
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-46">
          {!isGuest && (
            <DropdownMenuItem asChild>
              <Link href={`/meetings/${meeting.id}/edit`}>
                <Pencil />
                Edit meeting
              </Link>
            </DropdownMenuItem>
          )}
          {meeting.status === "pending" && (
            <DropdownMenuItem onSelect={() => actions.confirm(meeting).then(onChanged, () => {})}>
              <CircleCheck />
              Mark as confirmed
            </DropdownMenuItem>
          )}
          {!closed && !isGuest && (
            <DropdownMenuItem onSelect={() => setDialog("cancel")}>
              <CircleX />
              Cancel meeting
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={dialog === "cancel"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Cancel this meeting?"
        description={`${summary}. The candidate's meeting will be marked as cancelled.`}
        confirmLabel="Cancel meeting"
        destructive
        onConfirm={() => actions.cancel(meeting).then(onChanged)}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Delete this meeting?"
        description={`${summary}. This permanently removes the meeting and can't be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => actions.remove(meeting).then(onChanged)}
      />
    </>
  );
}
