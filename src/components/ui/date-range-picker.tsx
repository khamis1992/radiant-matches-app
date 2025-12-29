import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = "Select date range",
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange>(value || { from: null, to: null });

  React.useEffect(() => {
    if (value) {
      setDate(value);
    }
  }, [value]);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    let newRange: DateRange;

    if (!date.from || (date.from && date.to)) {
      // Start new selection
      newRange = { from: selectedDate, to: null };
    } else {
      // Complete the range
      if (selectedDate < date.from) {
        newRange = { from: selectedDate, to: date.from };
      } else {
        newRange = { from: date.from, to: selectedDate };
      }
    }

    setDate(newRange);
    if (onChange) {
      onChange(newRange);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="single"
            selected={date.from || undefined}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
          {date.from && (
            <div className="p-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newRange = { from: null, to: null };
                  setDate(newRange);
                  if (onChange) onChange(newRange);
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

