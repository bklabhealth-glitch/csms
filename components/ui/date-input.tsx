"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateInputProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  className?: string;
}

export function DateInput({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  disabled = false,
  minDate,
  className,
}: DateInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Update input value when date value changes
  React.useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, "dd/MM/yyyy"));
    }
  }, [value]);

  // Handle manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Remove non-numeric characters except /
    input = input.replace(/[^\d/]/g, "");

    // Auto-add slashes
    if (input.length === 2 && !input.includes("/")) {
      input = input + "/";
    } else if (input.length === 5 && input.split("/").length === 2) {
      input = input + "/";
    }

    // Limit length
    if (input.length > 10) {
      input = input.substring(0, 10);
    }

    setInputValue(input);

    // Try to parse the date
    if (input.length === 10) {
      const parsedDate = parse(input, "dd/MM/yyyy", new Date());
      if (isValid(parsedDate)) {
        // Check if date is not before minDate
        if (minDate && parsedDate < minDate) {
          return;
        }
        onChange?.(parsedDate);
      }
    }
  };

  // Handle blur - validate and format
  const handleBlur = () => {
    if (inputValue.length === 10) {
      const parsedDate = parse(inputValue, "dd/MM/yyyy", new Date());
      if (isValid(parsedDate)) {
        if (minDate && parsedDate < minDate) {
          // Reset to current value or empty
          if (value && isValid(value)) {
            setInputValue(format(value, "dd/MM/yyyy"));
          } else {
            setInputValue("");
          }
          return;
        }
        onChange?.(parsedDate);
        setInputValue(format(parsedDate, "dd/MM/yyyy"));
      } else {
        // Invalid date - reset
        if (value && isValid(value)) {
          setInputValue(format(value, "dd/MM/yyyy"));
        } else {
          setInputValue("");
        }
      }
    } else if (inputValue.length > 0 && inputValue.length < 10) {
      // Incomplete date - reset
      if (value && isValid(value)) {
        setInputValue(format(value, "dd/MM/yyyy"));
      } else {
        setInputValue("");
      }
    }
  };

  // Handle calendar select
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange?.(date);
      setInputValue(format(date, "dd/MM/yyyy"));
    }
    setOpen(false);
  };

  return (
    <div className={cn("relative flex gap-2", className)}>
      <Input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        className="flex-1"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={disabled}
            className="shrink-0"
            type="button"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            locale={th}
            disabled={minDate ? (date) => date < minDate : undefined}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
