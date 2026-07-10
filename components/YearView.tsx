"use client";

import { daysInMonth, MONTH_SHORT, monthDays, today, weekdayMon0 } from "@/lib/dates";
import { layoutSegments, laneCount, textFits } from "@/lib/layout";
import type { Category, EventItem } from "@/lib/types";
import { BUSY_COLOR, type ViewCallbacks } from "./CalendarApp";
import { BAR_FONT, useContainerWidth } from "./useContainerWidth";

const MAX_LANES = 3;
const BAR_H = 14;
const LANE_H = 16;
const FONT_PX = 10;

interface YearViewProps {
  months: { y: number; m0: number }[];
  events: EventItem[];
  categoriesById: Map<number, Category>;
  callbacks: ViewCallbacks;
}

/**
 * Wall-planner: 12 month rows × 31 day columns. Events as labeled bars
 * (full title where it fits, spill-over beside the bar otherwise).
 * Tap a day for full detail.
 */
export function YearView({ months, events, categoriesById, callbacks }: YearViewProps) {
  const todayYMD = today();
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const dayPx = width / 31;

  return (
    <div className="rounded-2xl border border-hairline bg-paper-raised shadow-[var(--shadow-soft)] overflow-x-auto">
      <div className="min-w-[880px]">
        {/* column numbers */}
        <div className="flex border-b border-hairline-strong bg-paper-sunken/60">
          <div className="w-12 shrink-0" />
          <div className="flex-1 grid" style={{ gridTemplateColumns: "repeat(31, 1fr)" }}>
            {Array.from({ length: 31 }, (_, i) => (
              <div
                key={i}
                className="py-1.5 text-center text-[10px] tabular-nums text-ink-faint"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {months.map(({ y, m0 }, monthIdx) => {
          const n = daysInMonth(y, m0);
          const days = monthDays(y, m0);
          const segs = layoutSegments(events, days[0], days[n - 1]);
          const lanes = Math.min(MAX_LANES, Math.max(1, laneCount(segs)));
          const rowHeight = 8 + lanes * LANE_H + 6;

          return (
            <div key={m0} className="flex border-b border-hairline last:border-b-0">
              <div className="w-12 shrink-0 grid place-items-center content-center border-r border-hairline bg-paper-sunken/40">
                <span className="font-display text-[13px] font-semibold text-ink-soft leading-none">
                  {MONTH_SHORT[m0]}
                </span>
                {(monthIdx === 0 || m0 === 0) && (
                  <span className="text-[9px] text-ink-faint leading-tight">{y}</span>
                )}
              </div>

              <div
                ref={monthIdx === 0 ? ref : undefined}
                className="relative flex-1"
                style={{ height: rowHeight }}
              >
                {/* event bars, labeled where the title fits */}
                {segs
                  .filter((s) => s.lane < MAX_LANES)
                  .map((seg) => {
                    const cat = categoriesById.get(seg.item.category_id);
                    const color = cat?.color ?? BUSY_COLOR;
                    const isBusy = seg.item.id.startsWith("busy-");
                    const label = isBusy ? "Busy" : seg.item.title;
                    const barPx = dayPx * seg.span - 2;
                    const fitsInside =
                      width > 0 && textFits(label, barPx - 8, FONT_PX, BAR_FONT);
                    const gapPx = dayPx * seg.trailingGap;
                    const spills =
                      !fitsInside && width > 0 && textFits(label, gapPx - 8, FONT_PX, BAR_FONT);
                    return (
                      <div key={`${seg.item.id}-${seg.col}`}>
                        <div
                          className={`absolute flex items-center justify-center overflow-hidden font-medium text-white pointer-events-none ${
                            seg.startsHere ? "rounded-l-[3px]" : ""
                          } ${seg.endsHere ? "rounded-r-[3px]" : ""}`}
                          style={{
                            left: `calc(${(seg.col / 31) * 100}% + 1px)`,
                            width: `calc(${(seg.span / 31) * 100}% - 2px)`,
                            top: 8 + seg.lane * LANE_H,
                            height: BAR_H,
                            background: color,
                            fontSize: FONT_PX,
                            boxShadow: "0 1px 1px rgba(60,45,25,0.12)",
                          }}
                        >
                          {fitsInside && (
                            <span className="whitespace-nowrap px-1 leading-none">{label}</span>
                          )}
                        </div>
                        {spills && (
                          <span
                            className="absolute flex items-center whitespace-nowrap font-medium text-ink-soft pointer-events-none"
                            style={{
                              left: `calc(${((seg.col + seg.span) / 31) * 100}% + 4px)`,
                              top: 8 + seg.lane * LANE_H,
                              height: BAR_H,
                              fontSize: FONT_PX,
                            }}
                          >
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  })}

                {/* clickable day cells on top */}
                <div
                  className="absolute inset-0 grid"
                  style={{ gridTemplateColumns: "repeat(31, 1fr)" }}
                >
                  {Array.from({ length: 31 }, (_, i) => {
                    if (i >= n) {
                      return (
                        <div
                          key={i}
                          className="bg-paper-sunken/70 border-r border-hairline/50 last:border-r-0"
                        />
                      );
                    }
                    const day = days[i];
                    const isWeekend = weekdayMon0(day) >= 5;
                    const isToday = day === todayYMD;
                    return (
                      <button
                        key={day}
                        onClick={() => callbacks.onDayClick(day)}
                        className={`border-r border-hairline/50 last:border-r-0 transition hover:bg-ink/[0.06] ${
                          isWeekend ? "bg-ink/[0.04]" : ""
                        } ${
                          isToday ? "outline outline-2 -outline-offset-2 outline-today z-10" : ""
                        }`}
                        aria-label={day}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
