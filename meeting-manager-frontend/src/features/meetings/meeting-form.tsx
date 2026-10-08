"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, startOfToday } from "date-fns";
import { Building2, CalendarIcon, Loader2, Video, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeSelect, addMinutes } from "@/components/time-select";
import { Textarea } from "@/components/ui/textarea";
import { CandidateAutocomplete } from "@/features/candidates/candidate-autocomplete";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { MEETING_STATUS_LABEL, MEETING_TYPE_LABEL, POSITIONS } from "@/lib/constants";
import type { Meeting, MeetingType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMeetingsStore } from "@/stores/meetings-store";
import {
  defaultMeetingFormValues,
  formValuesToPayload,
  meetingToFormValues,
  MeetingFormSchema,
  type MeetingFormValues,
} from "./meeting-form-schema";

const TYPE_OPTIONS: { value: MeetingType; icon: LucideIcon; hint: string }[] = [
  { value: "onsite", icon: Building2, hint: "In the office" },
  { value: "zoom", icon: Video, hint: "Zoom call" },
  { value: "google_meet", icon: Video, hint: "Google Meet call" },
];

interface MeetingFormProps {
  /** When provided, the form edits this meeting; otherwise it books a new one. */
  meeting?: Meeting;
}

export function MeetingForm({ meeting }: MeetingFormProps) {
  const router = useRouter();
  const createMeeting = useMeetingsStore((s) => s.createMeeting);
  const updateMeeting = useMeetingsStore((s) => s.updateMeeting);
  const isEdit = !!meeting;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(MeetingFormSchema),
    defaultValues: meeting ? meetingToFormValues(meeting) : defaultMeetingFormValues(),
  });
  const type = useWatch({ control, name: "type" });
  const position = useWatch({ control, name: "position" });
  const startTime = useWatch({ control, name: "startTime" });

  const onSubmit = async (values: MeetingFormValues) => {
    const payload = formValuesToPayload(values);
    try {
      const saved = isEdit
        ? await updateMeeting(meeting.id, payload)
        : await createMeeting(payload);
      toast.success(isEdit ? "Meeting updated" : `Meeting booked with ${saved.candidate.name}`);
      router.push(isEdit ? `/candidates/${saved.candidate.id}?meeting=${saved.id}` : "/dashboard");
    } catch (error) {
      // Map server-side field errors back onto the form where possible.
      if (error instanceof ApiError && error.details?.length) {
        for (const d of error.details) {
          const field =
            d.field === "startAt" ? "startTime" : d.field === "endAt" ? "endTime" : d.field;
          if (field in values) setError(field as keyof MeetingFormValues, { message: d.message });
        }
      }
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FieldSet>
        <FieldLegend>Candidate</FieldLegend>
        <FieldGroup className="grid gap-5 md:grid-cols-2">
          <Field data-invalid={!!errors.candidateName}>
            <FieldLabel htmlFor="candidateName">Candidate Name</FieldLabel>
            <Controller
              control={control}
              name="candidateName"
              render={({ field }) => (
                <CandidateAutocomplete
                  id="candidateName"
                  value={field.value}
                  invalid={!!errors.candidateName}
                  onChange={(name) => {
                    field.onChange(name);
                    setValue("candidateId", undefined); // typed text no longer refers to a picked candidate
                  }}
                  onSelect={(c) => {
                    field.onChange(c.name);
                    setValue("candidateId", c.id);
                    setValue("position", c.position, { shouldValidate: true });
                  }}
                />
              )}
            />
            <FieldDescription>Pick an existing candidate or type a new name.</FieldDescription>
            <FieldError errors={[errors.candidateName]} />
          </Field>

          <Field data-invalid={!!errors.position}>
            <FieldLabel htmlFor="position">Position</FieldLabel>
            <Controller
              control={control}
              name="position"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    setValue("candidateId", undefined);
                  }}
                >
                  <SelectTrigger
                    id="position"
                    className="h-10! w-full"
                    aria-invalid={!!errors.position}
                  >
                    <SelectValue placeholder="Select a position" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {/* Keep legacy/custom positions selectable when editing */}
                    {[...new Set([...POSITIONS, ...(position ? [position] : [])])].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.position]} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Schedule</FieldLegend>
        <FieldGroup className="grid gap-5 md:grid-cols-3">
          <Field data-invalid={!!errors.date}>
            <FieldLabel htmlFor="date">Date</FieldLabel>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      type="button"
                      variant="outline"
                      aria-invalid={!!errors.date}
                      className={cn(
                        "h-10 w-full justify-start font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon />
                      {field.value ? format(field.value, "EEE, MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={isEdit ? undefined : { before: startOfToday() }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <FieldError errors={[errors.date]} />
          </Field>

          <Field data-invalid={!!errors.startTime}>
            <FieldLabel htmlFor="startTime">Start time</FieldLabel>
            <Controller
              control={control}
              name="startTime"
              render={({ field }) => (
                <TimeSelect
                  id="startTime"
                  value={field.value}
                  invalid={!!errors.startTime}
                  placeholder="Pick a start time"
                  onChange={(start) => {
                    field.onChange(start);
                    // Keep the end after the start, preserving a 1-hour default slot.
                    if (getValues("endTime") <= start) {
                      setValue("endTime", addMinutes(start, 60), { shouldValidate: true });
                    }
                  }}
                />
              )}
            />
            <FieldError errors={[errors.startTime]} />
          </Field>

          <Field data-invalid={!!errors.endTime}>
            <FieldLabel htmlFor="endTime">End time</FieldLabel>
            <Controller
              control={control}
              name="endTime"
              render={({ field }) => (
                <TimeSelect
                  id="endTime"
                  value={field.value}
                  onChange={field.onChange}
                  after={startTime}
                  invalid={!!errors.endTime}
                  placeholder="Pick an end time"
                />
              )}
            />
            <FieldError errors={[errors.endTime]} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Meeting type</FieldLegend>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <div role="radiogroup" aria-label="Meeting type" className="grid gap-3 sm:grid-cols-3">
              {TYPE_OPTIONS.map(({ value, icon: Icon, hint }) => {
                const checked = field.value === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => field.onChange(value)}
                    className={cn(
                      "flex  items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      checked && "border-primary bg-accent hover:bg-accent",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg bg-muted",
                        checked && "bg-primary text-primary-foreground",
                      )}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-heading">
                        {MEETING_TYPE_LABEL[value]}
                      </span>
                      <span className="block text-xs text-muted-foreground">{hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
        <FieldGroup className="grid gap-5 md:grid-cols-2">
          <Field data-invalid={!!errors.location}>
            <FieldLabel htmlFor="location">
              {type === "onsite" ? "Location" : "Meeting link"}
            </FieldLabel>
            <Input
              id="location"
              className="h-10"
              placeholder={type === "onsite" ? "Conference Room A" : "https://zoom.us/j/…"}
              aria-invalid={!!errors.location}
              {...register("location")}
            />
            <FieldError errors={[errors.location]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status" className="h-10! w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {Object.entries(MEETING_STATUS_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Details</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="title">Title (optional)</FieldLabel>
            <Input
              id="title"
              className="h-10"
              placeholder={position ? `${position} Interview` : "Technical Interview"}
              {...register("title")}
            />
          </Field>
          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor="description">Notes</FieldLabel>
            <Textarea
              id="description"
              rows={4}
              placeholder="Agenda, interviewers, things to prepare…"
              {...register("description")}
            />
            <FieldError errors={[errors.description]} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isEdit ? "Save Changes" : "Book Meeting"}
        </Button>
      </div>
    </form>
  );
}
