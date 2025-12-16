"use client";

import * as React from "react";
import {
  format,
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
} from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DateRangePreset = {
  label: string;
  getValue: () => DateRange;
};

const getPresets = (): DateRangePreset[] => [
  {
    label: "Last 7 days",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 90 days",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 89)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 6 months",
    getValue: () => ({
      from: startOfDay(subMonths(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 1 year",
    getValue: () => ({
      from: startOfDay(subYears(new Date(), 1)),
      to: endOfDay(new Date()),
    }),
  },
];

export function DatePicker({
  dateRange,
  onDateRangeChange,
  className,
}: {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  className?: string;
}) {
  const [selectedRange, setSelectedRange] = React.useState<
    DateRange | undefined
  >(dateRange);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setSelectedRange(dateRange);
  }, [dateRange]);

  const handleSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    onDateRangeChange?.(range);
    // Close popover when both dates are selected
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  const handlePresetSelect = (preset: DateRangePreset) => {
    const range = preset.getValue();
    setSelectedRange(range);
    onDateRangeChange?.(range);
    setOpen(false);
  };

  const formatDateRange = (range: DateRange | undefined): string => {
    if (!range?.from) {
      return "Pick a date range";
    }
    if (range.from && !range.to) {
      return format(range.from, "LLL dd, y");
    }
    if (range.from && range.to) {
      return `${format(range.from, "LLL dd, y")} - ${format(range.to, "LLL dd, y")}`;
    }
    return "Pick a date range";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "min-w-[280px] justify-start text-left font-normal",
            !selectedRange?.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {formatDateRange(selectedRange)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            autoFocus
          />
          <div className="border-r p-3">
            <div className="flex flex-col gap-1">
              {getPresets().map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  className="w-full justify-start text-left text-sm font-normal"
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
