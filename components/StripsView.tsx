"use client";

import { daysInMonth, MONTH_NAMES, monthDays, today, weekdayMon0 } from "@/lib/dates";
import { layoutSegments, laneCount, textFits } from "@/lib/layout";
import type { Category, EventItem } from "@/lib/types";
import { BUSY_COLOR, type ViewCallbacks } from "./CalendarApp";
import { useDragCreate } from "./useDragCreate";
import { BAR_FONT, useContainerWidth } from "./useContainerWidth";

// Narrowest a day cell may get before the month wraps onto another line —
// wide enough that every single day keeps its number.
const MIN_DAY_PX = 22;

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
      {months.map(({ y, m0 }, monthIdx) => {
        const days = monthDays(y, m0);
        const n = daysInMonth(y, m0);

        // On narrow screens, wrap the month onto multiple lines rather than
        // dropping day numbers. Lines are balanced (16+15, not 30+1), and
        // cols is the grid width of every line.
        const fitAcross = Math.max(7, width > 0 ? Math.floor(width / MIN_DAY_PX) : n);
        const lineCount = Math.ceil(n / fitAcross);
        const cols = Math.ceil(n / lineCount);
        const lines: (typeof days)[] = [];
        for (let i = 0; i < n; i += cols) lines.push(days.slice(i, i + cols));
        const dayPx = width > 0 ? width / cols : 40;

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

            <div ref={monthIdx === 0 ? ref : undefined} className="flex-1">
              {lines.map((lineDays, li) => {
                const lineStart = lineDays[0];
                const lineEnd = lineDays[lineDays.length - 1];
                const segs = layoutSegments(events, lineStart, lineEnd);
                const lanes = Math.max(1, laneCount(segs));
                const lineHeight = NUM_H + lanes * LANE_H + 8;

                return (
                  <div
                    key={lineStart}
                    className="relative border-b border-hairline/60 last:border-b-0"
                    style={{ height: lineHeight }}
                  >
                    {/* day cells (+ filler after the month ends) */}
                    <div
                      className="absolute inset-0 grid"
                      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                    >
                      {lineDays.map((day) => {
                        const isWeekend = weekdayMon0(day) >= 5;
                        const isToday = day === todayYMD;
                        const selected = drag.isSelected(day);
                        return (
                          <div
                            key={day}
                            data-date={day}
                            className={`relative border-r border-hairline/70 last:border-r-0 ${
                              isWeekend ? "bg-ink/[0.045]" : ""
                            } ${selected ? "bg-today/15" : ""} ${
                              isToday
                                ? "outline outline-2 -outline-offset-2 outline-today/70 z-10"
                                : ""
                            } ${readOnly ? "" : "cursor-crosshair"}`}
                          >
                            <span
                              className={`absolute left-1/2 -translate-x-1/2 top-[3px] text-[10px] tabular-nums ${
                                isToday ? "font-bold text-today" : "text-ink-faint"
                              }`}
                            >
                              {Number(day.slice(8, 10))}
                            </span>
                          </div>
                        );
                      })}
                      {Array.from({ length: cols - lineDays.length }, (_, i) => (
                        <div
                          key={`filler-${i}`}
                          className="bg-paper-sunken/70 border-r border-hairline/50 last:border-r-0"
                        />
                      ))}
                    </div>

                    {/* event bars */}
                    {segs.map((seg) => {
                      const cat = categoriesById.get(seg.item.category_id);
                      const color = cat?.color ?? BUSY_COLOR;
                      const isBusy = seg.item.id.startsWith("busy-");
                      const label = isBusy ? "Busy" : seg.item.title;
                      const barPx = dayPx * seg.span - 4;
                      const fitsInside =
                        width > 0 && textFits(label, barPx - 10, fontPx, BAR_FONT);
                      // Spill-over may run into the filler cells after the
                      // month ends, but only for the lane's last bar — bars
                      // followed by another bar keep their true gap.
                      const reachesLineEnd =
                        seg.col + seg.span + seg.trailingGap >= lineDays.length;
                      const gapCols =
                        seg.trailingGap + (reachesLineEnd ? cols - lineDays.length : 0);
                      const gapPx = dayPx * gapCols;
                      const spills =
                        !fitsInside && width > 0 && textFits(label, gapPx - 10, fontPx, BAR_FONT);
                      return (
                        <div key={`${seg.item.id}-${seg.col}`}>
                          <button
                            data-bar
                            disabled={readOnly}
                            onClick={() =>
                              readOnly ? undefined : callbacks.onEventClick(seg.item)
                            }
                            title={isBusy ? "Busy" : seg.item.title}
                            className={`absolute flex items-center justify-center font-medium text-white transition hover:brightness-105 disabled:cursor-default overflow-hidden ${
                              seg.startsHere ? "rounded-l" : ""
                            } ${seg.endsHere ? "rounded-r" : ""}`}
                            style={{
                              left: `calc(${(seg.col / cols) * 100}% + 2px)`,
                              width: `calc(${(seg.span / cols) * 100}% - 4px)`,
                              top: NUM_H + seg.lane * LANE_H,
                              height: LANE_H - 4,
                              background: color,
                              fontSize: fontPx,
                              boxShadow: "0 1px 2px rgba(60,45,25,0.15)",
                            }}
                          >
                            {fitsInside && (
                              <span className="whitespace-nowrap px-1">{label}</span>
                            )}
                          </button>
                          {spills && (
                            <span
                              className="absolute flex items-center whitespace-nowrap font-medium text-ink-soft pointer-events-none"
                              style={{
                                left: `calc(${((seg.col + seg.span) / cols) * 100}% + 5px)`,
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
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
