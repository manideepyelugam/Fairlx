"use client";

import * as React from "react";
import { format } from "date-fns";
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
      ...buttonProps
    },
    ref
  ) => {
    return (
    <Popover>
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
          <CalendarIcon className="mr-2 size-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(date) => onChange(date ?? undefined)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
    );
  }
);

DatePicker.displayName = "DatePicker";
