"use client"

import { addDays, format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface FriendlyDatePickerProps {
  value: Date
  onChange: (date: Date) => void
  error?: string
}

export function FriendlyDatePicker({ value, onChange, error }: FriendlyDatePickerProps) {
  const shortcuts = [
    { label: "Today", date: new Date() },
    { label: "Tomorrow", date: addDays(new Date(), 1) },
    { label: "Next week", date: addDays(new Date(), 7) },
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            error && "border-destructive"
          )}
        >
          <CalendarIcon className="mr-2 size-4 text-primary" />
          {value ? format(value, "EEE, MMM dd, yyyy") : "Choose a due date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="mb-3 grid grid-cols-3 gap-2">
          {shortcuts.map((item) => (
            <Button
              key={item.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange(item.date)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <Calendar mode="single" selected={value} onSelect={(date) => date && onChange(date)} />
      </PopoverContent>
    </Popover>
  )
}
