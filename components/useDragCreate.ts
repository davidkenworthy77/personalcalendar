"use client";

import { useEffect, useRef, useState } from "react";
import type { YMD } from "@/lib/dates";
import { maxYMD, minYMD } from "@/lib/dates";

export interface DragSelection {
  start: YMD;
  end: YMD;
}

/**
 * Drag-across-days selection. Mouse/pen drags paint a range (across week rows
 * and month strips — anything carrying data-date under the pointer counts).
 * Touch gets a simple tap (drag would fight scrolling); the event dialog's
 * date fields cover multi-day on phones.
 */
export function useDragCreate(
  enabled: boolean,
  onDone: (start: YMD, end: YMD) => void
) {
  const [selection, setSelection] = useState<DragSelection | null>(null);
  const originRef = useRef<YMD | null>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!originRef.current) return;

    function dateUnderPointer(e: PointerEvent): YMD | null {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      return el?.closest("[data-date]")?.getAttribute("data-date") ?? null;
    }
    function onMove(e: PointerEvent) {
      const date = dateUnderPointer(e);
      const origin = originRef.current;
      if (date && origin) {
        setSelection({ start: minYMD(origin, date), end: maxYMD(origin, date) });
      }
    }
    function finish(e: PointerEvent) {
      const origin = originRef.current;
      originRef.current = null;
      const date = dateUnderPointer(e) ?? origin;
      setSelection(null);
      if (origin && date) {
        onDoneRef.current(minYMD(origin, date), maxYMD(origin, date));
      }
    }
    function cancel() {
      originRef.current = null;
      setSelection(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [selection === null]); // eslint-disable-line react-hooks/exhaustive-deps

  function onPointerDown(e: React.PointerEvent) {
    if (!enabled || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-bar]")) return; // bars have their own clicks
    const date = target.closest("[data-date]")?.getAttribute("data-date");
    if (!date) return;
    if (e.pointerType === "touch") {
      // Tap-to-create: single day, immediately.
      onDoneRef.current(date, date);
      return;
    }
    e.preventDefault();
    originRef.current = date;
    setSelection({ start: date, end: date });
  }

  function isSelected(day: YMD): boolean {
    return selection !== null && selection.start <= day && day <= selection.end;
  }

  return { selection, onPointerDown, isSelected };
}
