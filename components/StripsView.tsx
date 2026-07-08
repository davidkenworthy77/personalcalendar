"use client";

import { daysInMonth, MONTH_NAMES, monthDays, today, weekdayMon0 } from "@/lib/dates";
import { layoutSegments, laneCount, textFits } from "@/lib/layout";
import type { Category, EventItem } from "@/lib/types";
import { BUSY_COLOR, type ViewCallbacks } from "./CalendarApp";
import { useDragCreate } from "./useDragCreate";
import { BAR_FONT, useContainerWidth } from "./useContainerWidth";

interface StripsViewProps {
  months: { y: number; m0: number }[];
  dense: boolean; // 6-month = dense
  events: EventItem[];
  categoriesById: Map<number, Category>;
  readOnly: boolean;
  callbacks: ViewCallbacks;
}

export function StripsView({
  months,
  dense,
  events,
  categoriesById,
  readOnly,
  callbacks,
}: StripsViewProps) {
  const drag = useDragCreate(!readOnly, callbacks.onSelectRange);
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const todayYMD = today();

  const LANE_H = dense ? 19 : 26;
  const NUM_H = dense ? 18 : 22;
  const fontPx = dense ? 10.5 : 12.5;

  return (
    <div className="calendar-surface space-y-3" onPointerDown={drag.onPointerDown}>
      {months.map(({ y, m0 }) => {
        const days = monthDays(y, m0);
        const n = daysInMonth(y, m0);
        const first = days[0];
        const last = days[n - 1];
        const segs = layoutSegments(events, first, last);
        const lanes = Math.max(1, laneCount(segs));
        // width is measured on the grid area itself (label column excluded)
        const stripHeight = NUM_H + lanes * LANE_H + 8;
        const dayPx = width / n;

        return (
          <div
            key={`${y}-${m0}`}
            className="rounded-xl border border-hairline bg-paper-raised shadow-[var(--shadow-soft)] overflow-hidden sm:flex"
          >
            <div className="sm:w-[112px] shrink-0 px-3 py-2 sm:py-3 border-b sm:border-b-0 sm:border-r border-hairline bg-paper-sunken/50 flex sm:block items-baseline gap-2">
              <div className="font-display text-lg font-semibold leading-tight">
                {MONTH_NAMES[m0]}
              </div>
              <div className="text-xs text-ink-faint">{y}</div>
            </div>

            <div
              ref={months[0].y === y && months[0].m0 === m0 ? ref : undefined}
              className="relative flex-1"
              style={{ height: stripHeight }}
            >
              {/* day cells */}
              <div
                className="absolute inset-0 grid"
                style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
              >
                {days.map((day) => {
                  const wd = weekdayMon0(day);
                  const isWeekend = wd >= 5;
                  const isToday = day === todayYMD;
                  const selected = drag.isSelected(day);
                  const dom = Number(day.slice(8, 10));
                  // Every day gets its number; only drop to every-5th when
                  // cells are physically too narrow (phones).
                  const sparse = width > 0 && dayPx < 16;
                  const showNum = sparse ? dom === 1 || dom % 5 === 0 : true;
                  return (
                    <div
                      key={day}
                      data-date={day}
                      className={`relative border-r border-hairline/70 last:border-r-0 ${
                        isWeekend ? "bg-ink/[0.045]" : ""
                      } ${selected ? "bg-today/15" : ""} ${
                        isToday ? "outline outline-2 -outline-offset-2 outline-today/70 z-10" : ""
                      } ${readOnly ? "" : "cursor-crosshair"}`}
                    >
                      {showNum && (
                        <span
                          className={`absolute left-1/2 -translate-x-1/2 top-[3px] text-[10px] tabular-nums ${
                            isToday ? "font-bold text-today" : "text-ink-faint"
                          }`}
                        >
                          {dom}
                        </span>
                      )}
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
                const barPx = dayPx * seg.span - 4;
                const fitsInside = width > 0 && textFits(label, barPx - 10, fontPx, BAR_FONT);
                const gapPx = dayPx * seg.trailingGap;
                const spills =
                  !fitsInside && width > 0 && textFits(label, gapPx - 10, fontPx, BAR_FONT);
                return (
                  <div key={`${seg.item.id}-${seg.col}`}>
                    <button
                      data-bar
                      disabled={readOnly}
                      onClick={() => (readOnly ? undefined : callbacks.onEventClick(seg.item))}
                      title={isBusy ? "Busy" : seg.item.title}
                      className={`absolute flex items-center justify-center font-medium text-white transition hover:brightness-105 disabled:cursor-default overflow-hidden ${
                        seg.startsHere ? "rounded-l" : ""
                      } ${seg.endsHere ? "rounded-r" : ""}`}
                      style={{
                        left: `calc(${(seg.col / n) * 100}% + 2px)`,
                        width: `calc(${(seg.span / n) * 100}% - 4px)`,
                        top: NUM_H + seg.lane * LANE_H,
                        height: LANE_H - 4,
                        background: color,
                        fontSize: fontPx,
                        boxShadow: "0 1px 2px rgba(60,45,25,0.15)",
                      }}
                    >
                      {fitsInside && <span className="whitespace-nowrap px-1">{label}</span>}
                    </button>
                    {spills && (
                      <span
                        className="absolute flex items-center whitespace-nowrap font-medium text-ink-soft pointer-events-none"
                        style={{
                          left: `calc(${((seg.col + seg.span) / n) * 100}% + 5px)`,
                          top: NUM_H + seg.lane * LANE_H,
                          height: LANE_H - 4,
                          fontSize: fontPx,
                        }}
                      >
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
