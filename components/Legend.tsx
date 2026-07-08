import type { Category } from "@/lib/types";
import { BUSY_COLOR } from "./CalendarApp";

export function Legend({ categories, readOnly }: { categories: Category[]; readOnly: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-soft">
      {categories.map((c) => (
        <span key={c.id} className="flex items-center gap-1.5">
          <span
            className={c.is_custody ? "h-[7px] w-5 rounded-sm" : "h-3 w-3 rounded-[4px]"}
            style={{ background: c.color }}
          />
          {c.name}
        </span>
      ))}
      {readOnly && (
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[4px]" style={{ background: BUSY_COLOR }} />
          Busy
        </span>
      )}
    </div>
  );
}
