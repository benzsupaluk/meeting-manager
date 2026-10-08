"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Star } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCandidateStore } from "@/stores/candidate-store";

const NONE = "none";

const FeedbackFormSchema = z.object({
  meetingId: z.string(),
  rating: z.number().int().min(1, "Choose a rating").max(5),
  comment: z.string().trim().min(1, "Feedback is required").max(5000),
});
type FeedbackValues = z.infer<typeof FeedbackFormSchema>;

interface Props {
  candidateId: string;
  meetings: Meeting[];
  defaultMeetingId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({
  candidateId,
  meetings,
  defaultMeetingId,
  open,
  onOpenChange,
}: Props) {
  const addFeedback = useCandidateStore((s) => s.addFeedback);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackValues>({
    resolver: zodResolver(FeedbackFormSchema),
    values: { meetingId: defaultMeetingId ?? NONE, rating: 0, comment: "" },
  });

  const onSubmit = async ({ meetingId, ...rest }: FeedbackValues) => {
    try {
      await addFeedback(candidateId, { ...rest, meetingId: meetingId === NONE ? null : meetingId });
      toast.success("Feedback added");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Feedback</DialogTitle>
          <DialogDescription>Share your evaluation of the candidate.</DialogDescription>
        </DialogHeader>
        <form id="feedback-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="feedback-meeting">Related meeting</FieldLabel>
              <Controller
                control={control}
                name="meetingId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="feedback-meeting" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectItem value={NONE}>General feedback</SelectItem>
                      {meetings.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.title} · {formatDate(m.startAt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field data-invalid={!!errors.rating}>
              <FieldLabel id="rating-label">Rating</FieldLabel>
              <Controller
                control={control}
                name="rating"
                render={({ field }) => (
                  <div role="radiogroup" aria-labelledby="rating-label" className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={field.value === n}
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        onClick={() => field.onChange(n)}
                        className=" rounded-md p-1 transition-transform hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        <Star
                          className={cn(
                            "size-6",
                            n <= field.value
                              ? "fill-warning text-warning"
                              : "text-muted-foreground/40",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                )}
              />
              <FieldError errors={[errors.rating]} />
            </Field>
            <Field data-invalid={!!errors.comment}>
              <FieldLabel htmlFor="feedback-comment">Feedback</FieldLabel>
              <Textarea
                id="feedback-comment"
                rows={5}
                placeholder="Strengths, concerns, recommendation…"
                aria-invalid={!!errors.comment}
                {...register("comment")}
              />
              <FieldError errors={[errors.comment]} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="feedback-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Save Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
