"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type ButtonProps = React.ComponentPropsWithoutRef<typeof Button>;

interface DatePickerProps
  extends Omit<ButtonProps, "children" | "value" | "onChange"> {
  value?: Date | null;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  /** Earliest selectable date (inclusive). Dates before this are disabled. */
  minDate?: Date;
  /** Latest selectable date (inclusive). Dates after this are disabled. */
  maxDate?: Date;
}

export const DatePicker = React.forwardRef<
  HTMLButtonElement,
  DatePickerProps
>(
  (
    {
      value,
      onChange,
      placeholder = "Select date",
      className,
      variant = "outline",
      size = "lg",
      minDate,
      maxDate,
      ...buttonProps
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (date: Date | undefined) => {
      onChange(date ?? undefined);
      // Auto-close the calendar as soon as a date is picked
      setOpen(false);
    };

    // Build the disabled matcher: block dates outside [minDate, maxDate]
    const disabledMatcher = React.useCallback(
      (day: Date) => {
        const d = startOfDay(day);
        if (minDate && d < startOfDay(minDate)) return true;
        if (maxDate && d > startOfDay(maxDate)) return true;
        return false;
      },
      [minDate, maxDate]
    );

    return (
      <Popover modal={true} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant={variant}
            size={size}
            className={cn(
              "w-full justify-start text-left font-normal px-3",
              !value && "text-muted-foreground",
              className
            )}
            {...buttonProps}
          >
            <CalendarIcon className="mr-2 size-4 flex-shrink-0" />
            <span className="truncate">
              {value ? format(value, "PPP") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[200]">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={handleSelect}
            disabled={disabledMatcher}
            defaultMonth={value ?? minDate ?? undefined}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  }
);

DatePicker.displayName = "DatePicker";
