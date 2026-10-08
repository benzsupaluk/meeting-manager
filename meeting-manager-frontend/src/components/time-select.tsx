"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAY_MINUTES = 24 * 60;

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
};

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Adds `minutes` to an HH:mm time, capped at the last slot of the day. */
export function addMinutes(time: string, minutes: number, step = 15) {
  return toTime(Math.min(toMinutes(time) + minutes, DAY_MINUTES - step));
}

/** HH:mm slots on a `step`-minute grid, strictly after `after` when given. Keeps `value` if it is valid. */
export function timeOptions({ after, value, step = 15 }: { after?: string; value?: string; step?: number } = {}) {
  const afterMin = after ? toMinutes(after) : NaN;
  const first = Number.isNaN(afterMin) ? 0 : (Math.floor(afterMin / step) + 1) * step;
  const options: string[] = [];
  for (let t = first; t < DAY_MINUTES; t += step) options.push(toTime(t));
  if (value && !Number.isNaN(toMinutes(value)) && (!after || value > after) && !options.includes(value)) {
    options.push(value);
    options.sort();
  }
  return options;
}

interface TimeSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Only times strictly after this HH:mm value are offered. */
  after?: string;
  step?: number;
  invalid?: boolean;
  placeholder?: string;
}

export function TimeSelect({ id, value, onChange, after, step, invalid, placeholder = "Pick a time" }: TimeSelectProps) {
  const options = timeOptions({ after, value, step });
  return (
    <Select value={value} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger id={id} className="h-10! w-full" aria-invalid={invalid}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="max-h-72">
        {options.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
