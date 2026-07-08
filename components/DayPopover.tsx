"use client";

import { formatMedium, formatRange, rangesOverlap, type YMD } from "@/lib/dates";
import type { Category, EventItem } from "@/lib/types";
import { BUSY_COLOR } from "./CalendarApp";

interface DayPopoverProps {
  day: YMD;
  events: EventItem[];
  categoriesById: Map<number, Category>;
  readOnly: boolean;
  onAdd: () => void;
  onEdit: (e: EventItem) => void;
  onClose: () => void;
}

export function DayPopover({
  day,
  events,
  categoriesById,
  readOnly,
  onAdd,
  onEdit,
  onClose,
}: DayPopoverProps) {
  const dayEvents = events.filter((e) =>
    rangesOverlap(e.start_date, e.end_date, day, day)
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pop-in w-full sm:max-w-sm bg-paper-raised rounded-t-2xl sm:rounded-2xl border border-hairline shadow-[var(--shadow-pop)] p-5 space-y-4"
      >
        <h2 className="font-display text-xl font-semibold">{formatMedium(day)}</h2>

        {dayEvents.length === 0 ? (
          <p className="text-sm text-ink-faint">Nothing planned.</p>
        ) : (
          <ul className="space-y-1.5">
            {dayEvents.map((e) => {
              const isBusy = e.id.startsWith("busy-");
              const color = categoriesById.get(e.category_id)?.color ?? BUSY_COLOR;
              return (
                <li key={e.id}>
                  <button
                    disabled={readOnly || isBusy}
                    onClick={() => onEdit(e)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition enabled:hover:bg-paper-sunken disabled:cursor-default"
                  >
                    <span className="h-3 w-3 rounded-[4px] shrink-0" style={{ background: color }} />
                    <span className="flex-1">
                      <span className="block text-sm font-medium">
                        {isBusy ? "Busy" : e.title}
                      </span>
                      <span className="block text-xs text-ink-soft">
                        {formatRange(e.start_date, e.end_date)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!readOnly && (
          <button
            onClick={onAdd}
            className="w-full rounded-xl border border-dashed border-hairline-strong px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-paper-sunken transition"
          >
            + Add event on this day
          </button>
        )}
      </div>
    </div>
  );
}
