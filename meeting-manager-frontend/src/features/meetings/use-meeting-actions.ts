"use client";

import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import type { Meeting } from "@/lib/types";
import { useMeetingsStore } from "@/stores/meetings-store";

/** Store mutations wrapped with user feedback; rethrows so dialogs can stay open on failure. */
export function useMeetingActions() {
  const updateMeeting = useMeetingsStore((s) => s.updateMeeting);
  const deleteMeeting = useMeetingsStore((s) => s.deleteMeeting);

  const run = async <T,>(action: () => Promise<T>, success: string) => {
    try {
      const result = await action();
      toast.success(success);
      return result;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  return {
    cancel: (meeting: Meeting) =>
      run(() => updateMeeting(meeting.id, { status: "cancelled" }), `Meeting with ${meeting.candidate.name} cancelled`),
    confirm: (meeting: Meeting) =>
      run(() => updateMeeting(meeting.id, { status: "confirmed" }), `Meeting with ${meeting.candidate.name} confirmed`),
    remove: (meeting: Meeting) => run(() => deleteMeeting(meeting.id), "Meeting deleted"),
  };
}
