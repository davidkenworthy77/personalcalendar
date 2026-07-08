import { diffDays, maxYMD, minYMD, rangesOverlap, type YMD } from "./dates";

export interface DateRanged {
  start_date: YMD;
  end_date: YMD;
}

export interface Segment<T extends DateRanged> {
  item: T;
  /** 0-based column within the row. */
  col: number;
  /** Number of days covered within the row. */
  span: number;
  lane: number;
  startsHere: boolean;
  endsHere: boolean;
  /** Free columns after this segment before the next bar in the same lane
   * (or the row edge) — room for a spill-over label. */
  trailingGap: number;
}

/**
 * Clamp events to a row of consecutive days [rowStart..rowEnd] and stack them
 * into lanes (greedy, first-fit). Items sorted by start date, longer first —
 * the classic calendar look where long bars hug the top.
 */
export function layoutSegments<T extends DateRanged>(
  items: T[],
  rowStart: YMD,
  rowEnd: YMD
): Segment<T>[] {
  const overlapping = items
    .filter((e) => rangesOverlap(e.start_date, e.end_date, rowStart, rowEnd))
    .sort((a, b) => {
      if (a.start_date !== b.start_date) return a.start_date < b.start_date ? -1 : 1;
      const lenA = diffDays(a.start_date, a.end_date);
      const lenB = diffDays(b.start_date, b.end_date);
      return lenB - lenA;
    });

  const laneEnds: number[] = []; // last occupied column (inclusive) per lane
  const segments: Segment<T>[] = [];

  for (const item of overlapping) {
    const clampedStart = maxYMD(item.start_date, rowStart);
    const clampedEnd = minYMD(item.end_date, rowEnd);
    const col = diffDays(rowStart, clampedStart);
    const endCol = diffDays(rowStart, clampedEnd);

    let lane = laneEnds.findIndex((last) => last < col);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(endCol);
    } else {
      laneEnds[lane] = endCol;
    }

    segments.push({
      item,
      col,
      span: endCol - col + 1,
      lane,
      startsHere: clampedStart === item.start_date,
      endsHere: clampedEnd === item.end_date,
      trailingGap: 0,
    });
  }

  // Trailing gap per lane: distance to the next bar in the same lane, or to
  // the end of the row.
  const rowLength = diffDays(rowStart, rowEnd) + 1;
  const byLane = new Map<number, Segment<T>[]>();
  for (const s of segments) {
    const list = byLane.get(s.lane) ?? [];
    list.push(s);
    byLane.set(s.lane, list);
  }
  for (const list of byLane.values()) {
    list.sort((a, b) => a.col - b.col);
    for (let i = 0; i < list.length; i++) {
      const next = list[i + 1];
      list[i].trailingGap = (next ? next.col : rowLength) - (list[i].col + list[i].span);
    }
  }
  return segments;
}

export function laneCount<T extends DateRanged>(segments: Segment<T>[]): number {
  return segments.reduce((max, s) => Math.max(max, s.lane + 1), 0);
}

/** Rough but reliable: will `text` fit in a bar `widthPx` wide at `fontPx`? */
let measureCtx: CanvasRenderingContext2D | null = null;
export function textFits(text: string, widthPx: number, fontPx: number, font: string): boolean {
  if (typeof document === "undefined") return false;
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) return false;
  measureCtx.font = `500 ${fontPx}px ${font}`;
  return measureCtx.measureText(text).width <= widthPx;
}
