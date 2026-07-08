import { addDays, addMonths, diffDays, monthIndex, year, type YMD } from "./dates";
import type { CustodyBlock, CustodyOverride, CustodyPattern } from "./types";

/**
 * Compute custody blocks for an inclusive date range by walking the repeating
 * cycle out from the anchor date (in both directions), then applying overrides.
 *
 * Two kinds of cycle segment:
 *  - `days`: fixed length (week on / week off, alternating weekends…)
 *  - `months`: calendar months (month about, handing over on the same date
 *    each month — the block from Jun 24 ends Jul 23 even though the lengths
 *    differ). Month starts are always computed from the anchor, so a day like
 *    the 31st clamps in short months without drifting.
 *
 * Blocks are pure — nothing is ever materialized. An override is keyed by the
 * pattern-computed start date of the block it swaps.
 */
export function getCustodyBlocks(
  pattern: CustodyPattern,
  overrides: CustodyOverride[],
  rangeStart: YMD,
  rangeEnd: YMD
): CustodyBlock[] {
  const monthly = pattern.cycle.some((s) => (s.months ?? 0) > 0);
  const cycle = pattern.cycle.filter((s) =>
    monthly ? (s.months ?? 0) > 0 : (s.days ?? 0) > 0
  );
  if (cycle.length === 0) return [];

  const byStart = new Map(overrides.map((o) => [o.occurrence_start, o.holder]));
  const blocks: CustodyBlock[] = [];

  const push = (start: YMD, end: YMD, patternHolder: CustodyBlock["patternHolder"]) => {
    const overridden = byStart.get(start);
    blocks.push({
      start,
      end,
      holder: overridden ?? patternHolder,
      patternHolder,
      isSwapped: overridden !== undefined && overridden !== patternHolder,
    });
  };

  if (monthly) {
    const cycleMonths = cycle.reduce((sum, s) => sum + (s.months ?? 0), 0);
    // Rewind to a cycle iteration safely before rangeStart, then walk forward.
    const monthsBetween =
      (year(rangeStart) - year(pattern.anchor_date)) * 12 +
      (monthIndex(rangeStart) - monthIndex(pattern.anchor_date));
    let cursorMonths =
      (Math.floor(monthsBetween / cycleMonths) - 1) * cycleMonths;

    outer: while (true) {
      for (const segment of cycle) {
        const start = addMonths(pattern.anchor_date, cursorMonths);
        const end = addDays(addMonths(pattern.anchor_date, cursorMonths + segment.months!), -1);
        cursorMonths += segment.months!;
        if (end < rangeStart) continue;
        if (start > rangeEnd) break outer;
        push(start, end, segment.holder);
      }
    }
  } else {
    const cycleLength = cycle.reduce((sum, s) => sum + (s.days ?? 0), 0);
    const offset = diffDays(pattern.anchor_date, rangeStart);
    const iterations = Math.floor(offset / cycleLength);
    let cursor = addDays(pattern.anchor_date, iterations * cycleLength);

    while (cursor <= rangeEnd) {
      for (const segment of cycle) {
        const start = cursor;
        const end = addDays(start, segment.days! - 1);
        cursor = addDays(end, 1);
        if (end < rangeStart) continue;
        if (start > rangeEnd) break;
        push(start, end, segment.holder);
      }
    }
  }
  return blocks;
}

/** The holder for a single day, or null if no pattern is set. */
export function holderOn(blocks: CustodyBlock[], day: YMD): CustodyBlock | null {
  return blocks.find((b) => b.start <= day && day <= b.end) ?? null;
}
