"use client";

import { useMemo } from "react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { ConsultationMode } from "@prisma/client";

export interface SlotOption {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  mode: ConsultationMode;
  booked: boolean;
  isBlocked: boolean;
}

interface BookingCalendarProps {
  slots: SlotOption[];
  selectedSlotId?: string;
  onSelect: (slotId: string) => void;
}

export function BookingCalendar({
  slots,
  selectedSlotId,
  onSelect,
}: BookingCalendarProps) {
  const byDate = useMemo(() => {
    const map = new Map<string, SlotOption[]>();
    for (const slot of slots) {
      const key = new Date(slot.date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    Array.from(map.values()).forEach((list) => {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return Array.from(map.entries()).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
  }, [slots]);

  if (slots.length === 0) {
    return (
      <p className="text-base text-slate-700 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
        No available slots for this selection. Please try another clinic or date range.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {byDate.map(([dateKey, daySlots]) => (
        <div key={dateKey}>
          <h4 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-200">
            {formatDate(dateKey)}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {daySlots.map((slot) => {
              const unavailable = slot.booked || slot.isBlocked;
              const selected = selectedSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={unavailable}
                  onClick={() => onSelect(slot.id)}
                  className={cn(
                    "rounded-lg border-2 px-4 py-4 text-base font-semibold transition-colors min-h-[56px]",
                    unavailable &&
                      "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through",
                    !unavailable &&
                      !selected &&
                      "border-teal-300 bg-white text-teal-900 hover:bg-teal-50 hover:border-teal-600",
                    selected &&
                      "border-teal-700 bg-teal-700 text-white"
                  )}
                  aria-pressed={selected}
                >
                  {formatTime(slot.startTime)}
                  {unavailable && (
                    <span className="block text-sm font-normal mt-1">
                      {slot.isBlocked ? "Blocked" : "Booked"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
