import type { YMD } from "./dates";

export type Holder = "me" | "coparent";

export interface Category {
  id: number;
  name: string;
  color: string;
  is_custody: boolean;
  holder: Holder | null;
  sort: number;
}

export interface EventItem {
  id: string;
  title: string;
  category_id: number;
  start_date: YMD;
  end_date: YMD; // inclusive
  notes: string | null;
}

export interface CycleSegment {
  holder: Holder;
  /** Fixed-length segment (e.g. week on / week off). */
  days?: number;
  /** Calendar-month segment (e.g. month about, swapping on the same date). */
  months?: number;
}

export interface CustodyPattern {
  anchor_date: YMD; // start of the first segment of the cycle
  cycle: CycleSegment[];
}

export interface CustodyOverride {
  occurrence_start: YMD;
  holder: Holder;
  note?: string | null;
}

export interface CustodyBlock {
  start: YMD;
  end: YMD; // inclusive
  holder: Holder;
  patternHolder: Holder; // what the pattern says without the override
  isSwapped: boolean;
}
