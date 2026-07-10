"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addMonths,
  endOfMonth,
  maxYMD,
  minYMD,
  monthIndex,
  MONTH_NAMES,
  MONTH_SHORT,
  startOfMonth,
  today,
  year,
  type YMD,
} from "@/lib/dates";
import type { Category, EventItem } from "@/lib/types";
import { MonthView } from "./MonthView";
import { StripsView } from "./StripsView";
import { YearView } from "./YearView";
import { EventDialog, type EventDraft } from "./EventDialog";
import { DayPopover } from "./DayPopover";
import { Legend } from "./Legend";

export type ViewKind = "month" | "3mo" | "6mo" | "year";

export const BUSY_COLOR = "#a8a29e";

export interface CalendarAppProps {
  readOnly?: boolean;
  /** Dev fixture mode: no auth, no DB — hides links that need a session. */
  sandbox?: boolean;
  categories: Category[];
  initialEvents: EventItem[];
}

export interface ViewCallbacks {
  onSelectRange: (start: YMD, end: YMD) => void;
  onEventClick: (event: EventItem) => void;
  onDayClick: (day: YMD) => void;
}

const VIEWS: { key: ViewKind; label: string; months: number }[] = [
  { key: "month", label: "Month", months: 1 },
  { key: "3mo", label: "3 Mo", months: 3 },
  { key: "6mo", label: "6 Mo", months: 6 },
  { key: "year", label: "Year", months: 12 },
];

export function CalendarApp({
  readOnly = false,
  sandbox = false,
  categories,
  initialEvents,
}: CalendarAppProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewKind>(readOnly ? "3mo" : "month");
  const [anchor, setAnchor] = useState<YMD>(startOfMonth(today()));
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [dayPopover, setDayPopover] = useState<YMD | null>(null);

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Visible range — every view is a rolling window from the anchor month.
  const viewMonths = VIEWS.find((v) => v.key === view)!.months;
  const rangeStart = anchor;
  const rangeEnd = endOfMonth(addMonths(anchor, viewMonths - 1));

  const months = useMemo(() => {
    const list: { y: number; m0: number }[] = [];
    let cursor = startOfMonth(rangeStart);
    while (cursor <= rangeEnd) {
      list.push({ y: year(cursor), m0: monthIndex(cursor) });
      cursor = addMonths(cursor, 1);
    }
    return list;
  }, [rangeStart, rangeEnd]);

  // ----- navigation -----
  function page(dir: -1 | 1) {
    const step = view === "year" ? 12 : view === "month" ? 1 : viewMonths;
    setAnchor((a) => addMonths(a, dir * step));
  }
  function goToday() {
    setAnchor(startOfMonth(today()));
  }

  // ----- event CRUD (optimistic, but failures are loud and resync) -----
  async function mutate(payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    if (sandbox) return null;
    try {
      const res = await fetch("/api/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`save failed (${res.status})`);
      return await res.json();
    } catch (err) {
      console.error(err);
      alert("That change didn't save — reloading to show what's really stored.");
      router.refresh();
      window.location.reload();
      return null;
    }
  }

  async function saveEvent(values: {
    id?: string;
    title: string;
    category_id: number;
    start_date: YMD;
    end_date: YMD;
    notes: string;
  }) {
    const start = minYMD(values.start_date, values.end_date);
    const end = maxYMD(values.start_date, values.end_date);
    const row = {
      title: values.title,
      category_id: values.category_id,
      start_date: start,
      end_date: end,
      notes: values.notes || null,
    };
    setDraft(null);
    if (values.id) {
      setEvents((es) => es.map((e) => (e.id === values.id ? { ...e, ...row } : e)));
      await mutate({ kind: "event.save", event: { id: values.id, ...row } });
    } else {
      const tempId = `temp-${Math.random().toString(36).slice(2)}`;
      setEvents((es) => [...es, { id: tempId, ...row }]);
      const result = await mutate({ kind: "event.save", event: row });
      if (result?.id) {
        setEvents((es) =>
          es.map((e) => (e.id === tempId ? { ...e, id: result.id as string } : e))
        );
      }
    }
  }

  async function deleteEvent(id: string) {
    setDraft(null);
    setEvents((es) => es.filter((e) => e.id !== id));
    if (!id.startsWith("temp-")) {
      await mutate({ kind: "event.delete", id });
    }
  }

  // ----- view callbacks -----
  const callbacks: ViewCallbacks = {
    onSelectRange: (start, end) => {
      if (readOnly) return;
      setDraft({ start_date: minYMD(start, end), end_date: maxYMD(start, end) });
    },
    onEventClick: (event) => {
      if (readOnly || event.id.startsWith("busy-")) return;
      setDraft({ ...event, notes: event.notes ?? "" });
    },
    onDayClick: (day) => setDayPopover(day),
  };

  const title =
    view === "month"
      ? `${MONTH_NAMES[monthIndex(anchor)]} ${year(anchor)}`
      : year(anchor) === year(rangeEnd)
        ? `${MONTH_SHORT[monthIndex(anchor)]} – ${MONTH_SHORT[monthIndex(rangeEnd)]} ${year(rangeEnd)}`
        : `${MONTH_SHORT[monthIndex(anchor)]} ${year(anchor)} – ${MONTH_SHORT[monthIndex(rangeEnd)]} ${year(rangeEnd)}`;

  return (
    <div className="flex-1 flex flex-col max-w-[1400px] w-full mx-auto px-3 sm:px-6 pb-10">
      {/* ----- header ----- */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 sm:py-5">
        <div className="flex items-baseline gap-3 mr-auto">
          <span className="font-display text-xl font-semibold tracking-tight text-ink-soft">
            Glance
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => page(-1)}
            aria-label="Previous"
            className="h-9 w-9 rounded-lg border border-hairline bg-paper-raised hover:bg-paper-sunken transition text-ink-soft"
          >
            ←
          </button>
          <button
            onClick={goToday}
            className="h-9 px-3 rounded-lg border border-hairline bg-paper-raised hover:bg-paper-sunken transition text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={() => page(1)}
            aria-label="Next"
            className="h-9 w-9 rounded-lg border border-hairline bg-paper-raised hover:bg-paper-sunken transition text-ink-soft"
          >
            →
          </button>
        </div>

        <div className="flex rounded-lg border border-hairline bg-paper-raised p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`h-8 px-3 rounded-md text-sm font-medium transition ${
                view === v.key
                  ? "bg-ink text-paper shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {!readOnly && !sandbox && (
          <Link
            href="/settings"
            aria-label="Settings"
            className="h-9 w-9 rounded-lg border border-hairline bg-paper-raised hover:bg-paper-sunken transition grid place-items-center text-ink-soft"
          >
            ⚙
          </Link>
        )}
        {sandbox && (
          <span className="h-9 px-3 rounded-lg bg-paper-sunken border border-hairline grid place-items-center text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Sandbox
          </span>
        )}
      </header>

      <Legend categories={categories} readOnly={readOnly} />

      {/* ----- view ----- */}
      <div className="mt-3 rise-in" key={`${view}-${anchor}`}>
        {view === "month" && (
          <MonthView
            y={year(anchor)}
            m0={monthIndex(anchor)}
            events={events}
            categoriesById={categoriesById}
            readOnly={readOnly}
            callbacks={callbacks}
          />
        )}
        {(view === "3mo" || view === "6mo") && (
          <StripsView
            months={months}
            dense={view === "6mo"}
            events={events}
            categoriesById={categoriesById}
            readOnly={readOnly}
            callbacks={callbacks}
          />
        )}
        {view === "year" && (
          <YearView
            months={months}
            events={events}
            categoriesById={categoriesById}
            callbacks={callbacks}
          />
        )}
      </div>

      {/* ----- dialogs ----- */}
      {draft && (
        <EventDialog
          draft={draft}
          categories={categories}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onClose={() => setDraft(null)}
        />
      )}
      {dayPopover && (
        <DayPopover
          day={dayPopover}
          events={events}
          categoriesById={categoriesById}
          readOnly={readOnly}
          onAdd={() => {
            const d = dayPopover;
            setDayPopover(null);
            callbacks.onSelectRange(d, d);
          }}
          onEdit={(e) => {
            setDayPopover(null);
            callbacks.onEventClick(e);
          }}
          onClose={() => setDayPopover(null)}
        />
      )}
    </div>
  );
}
