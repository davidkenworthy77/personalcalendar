import type { YMD } from "./dates";

export interface Category {
  id: number;
  name: string;
  color: string;
  /** Shared categories (the Holly ones) appear in full on the share link;
   * everything else is masked to "Busy". */
  is_custody: boolean;
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
