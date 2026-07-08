"use client";

import { dayOfMonth, monthIndex, monthWeeks, today, WEEKDAY_SHORT } from "@/lib/dates";
import { layoutSegments, laneCount, textFits } from "@/lib/layout";
import type { Category, EventItem } from "@/lib/types";
import { BUSY_COLOR, type ViewCallbacks } from "./CalendarApp";
import { useDragCreate } from "./useDragCreate";
import { BAR_FONT, useContainerWidth } from "./useContainerWidth";

const LANE_H = 28;
const DAY_NUM_H = 32;

interface MonthViewProps {
  y: number;
  m0: number;
  events: EventItem[];
  categoriesById: Map<number, Category>;
  readOnly: boolean;
  callbacks: ViewCallbacks;
}

export function MonthView({
  y,
  m0,
  events,
  categoriesById,
  readOnly,
  callbacks,
}: MonthViewProps) {
  const weeks = monthWeeks(y, m0);
  const todayYMD = today();
  const drag = useDragCreate(!readOnly, callbacks.onSelectRange);
  const { ref, width } = useContainerWidth<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="calendar-surface rounded-2xl border border-hairline bg-paper-raised shadow-[var(--shadow-soft)] overflow-hidden"
      onPointerDown={drag.onPointerDown}
    >
      {/* weekday header */}
      <div className="grid grid-cols-7 border-b border-hairline-strong bg-paper-sunken/60">
        {WEEKDAY_SHORT.map((d, i) => (
          <div
            key={d}
            className={`px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${
              i >= 5 ? "text-ink-faint" : "text-ink-soft"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {weeks.map((week) => {
        const segs = layoutSegments(events, week[0], week[6]);
        const lanes = laneCount(segs);
        const height = Math.max(112, DAY_NUM_H + lanes * LANE_H + 8);

        return (
          <div
            key={week[0]}
            className="relative border-b border-hairline last:border-b-0"
            style={{ height }}
          >
            {/* day cells */}
            <div className="absolute inset-0 grid grid-cols-7">
              {week.map((day, i) => {
                const inMonth = monthIndex(day) === m0;
                const isToday = day === todayYMD;
                const selected = drag.isSelected(day);
                return (
                  <div
                    key={day}
                    data-date={day}
                    className={`relative border-r border-hairline last:border-r-0 transition-colors ${
                      i >= 5 ? "bg-ink/[0.025]" : ""
                    } ${selected ? "bg-today/10" : ""} ${readOnly ? "" : "cursor-crosshair"}`}
                  >
                    <span
                      className={`absolute top-[10px] left-2 text-[13px] leading-none ${
                        isToday
                          ? "font-bold text-paper bg-today rounded-full h-6 w-6 -mt-1 -ml-1 grid place-items-center"
                          : inMonth
                            ? "font-medium text-ink-soft"
                            : "text-ink-faint/60"
                      }`}
                    >
                      {dayOfMonth(day)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* event bars */}
            {segs.map((seg) => {
              const cat = categoriesById.get(seg.item.category_id);
              const color = cat?.color ?? BUSY_COLOR;
              const isBusy = seg.item.id.startsWith("busy-");
              const label = isBusy ? "Busy" : seg.item.title;
              const barPx = (width * seg.span) / 7 - 6;
              // Full title or nothing — never an ellipsis. When the title
              // doesn't fit inside, it spills into free space beside the bar.
              const fitsInside = width === 0 || textFits(label, barPx - 16, 13, BAR_FONT);
              const gapPx = (width * seg.trailingGap) / 7;
              const spills =
                !fitsInside && width > 0 && textFits(label, gapPx - 14, 13, BAR_FONT);
              return (
                <div key={`${seg.item.id}-${seg.col}`}>
                  <button
                    data-bar
                    disabled={readOnly && isBusy}
                    onClick={() =>
                      isBusy ? undefined : readOnly ? undefined : callbacks.onEventClick(seg.item)
                    }
                    title={fitsInside || spills ? undefined : label}
                    className={`absolute flex items-center px-2 text-[13px] font-medium text-white transition hover:brightness-105 disabled:cursor-default overflow-hidden ${
                      seg.startsHere ? "rounded-l-md" : ""
                    } ${seg.endsHere ? "rounded-r-md" : ""}`}
                    style={{
                      left: `calc(${(seg.col / 7) * 100}% + 3px)`,
                      width: `calc(${(seg.span / 7) * 100}% - 6px)`,
                      top: DAY_NUM_H + seg.lane * LANE_H,
                      height: LANE_H - 5,
                      background: color,
                      boxShadow: "0 1px 2px rgba(60,45,25,0.15)",
                    }}
                  >
                    {fitsInside && <span className="whitespace-nowrap">{label}</span>}
                  </button>
                  {spills && (
                    <span
                      className="absolute flex items-center whitespace-nowrap text-[13px] font-medium text-ink-soft pointer-events-none"
                      style={{
                        left: `calc(${((seg.col + seg.span) / 7) * 100}% + 6px)`,
                        top: DAY_NUM_H + seg.lane * LANE_H,
                        height: LANE_H - 5,
                      }}
                    >
                      {label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
