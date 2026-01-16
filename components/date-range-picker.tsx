"use client";

import { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "เลือกช่วงวันที่",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  // Preset date ranges
  const presets = [
    {
      label: "วันนี้",
      getValue: () => ({
        from: new Date(),
        to: new Date(),
      }),
    },
    {
      label: "7 วันที่แล้ว",
      getValue: () => {
        const from = new Date();
        from.setDate(from.getDate() - 6);
        return { from, to: new Date() };
      },
    },
    {
      label: "30 วันที่แล้ว",
      getValue: () => {
        const from = new Date();
        from.setDate(from.getDate() - 29);
        return { from, to: new Date() };
      },
    },
    {
      label: "เดือนนี้",
      getValue: () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from, to: new Date() };
      },
    },
    {
      label: "เดือนที่แล้ว",
      getValue: () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const to = new Date(now.getFullYear(), now.getMonth(), 0);
        return { from, to };
      },
    },
    {
      label: "ปีนี้",
      getValue: () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), 0, 1);
        return { from, to: new Date() };
      },
    },
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    onChange(range);
    setOpen(false);
  };

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range) return placeholder;
    if (!range.from) return placeholder;

    if (range.to) {
      return `${format(range.from, "d MMM yyyy", { locale: th })} - ${format(
        range.to,
        "d MMM yyyy",
        { locale: th }
      )}`;
    }

    return format(range.from, "d MMM yyyy", { locale: th });
  };

  return (
    <div className="grid gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets */}
            <div className="border-r">
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium mb-2">ช่วงเวลาที่กำหนดไว้</p>
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start font-normal"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
                {value && (
                  <>
                    <div className="my-2 border-t" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start font-normal text-red-600 hover:text-red-700"
                      onClick={() => {
                        onChange(undefined);
                        setOpen(false);
                      }}
                    >
                      ล้างการเลือก
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={onChange}
                numberOfMonths={2}
                locale={th}
                disabled={disabled}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
