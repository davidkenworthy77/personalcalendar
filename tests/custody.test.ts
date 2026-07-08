// Plain-assertion unit tests for the custody engine.
// Run: npx tsx tests/custody.test.ts
import assert from "node:assert";
import { getCustodyBlocks, holderOn } from "../lib/custody";
import type { CustodyPattern } from "../lib/types";

const weekOnOff: CustodyPattern = {
  anchor_date: "2026-07-06", // a Monday, me-first
  cycle: [
    { holder: "me", days: 7 },
    { holder: "coparent", days: 7 },
  ],
};

// Basic pattern: anchor week is mine, next week is co-parent's.
{
  const blocks = getCustodyBlocks(weekOnOff, [], "2026-07-06", "2026-08-02");
  assert.equal(blocks[0].start, "2026-07-06");
  assert.equal(blocks[0].end, "2026-07-12");
  assert.equal(blocks[0].holder, "me");
  assert.equal(blocks[1].start, "2026-07-13");
  assert.equal(blocks[1].holder, "coparent");
  assert.equal(holderOn(blocks, "2026-07-10")!.holder, "me");
  assert.equal(holderOn(blocks, "2026-07-15")!.holder, "coparent");
}

// Works backwards from the anchor (range entirely before anchor_date).
{
  const blocks = getCustodyBlocks(weekOnOff, [], "2026-06-01", "2026-06-30");
  assert.ok(blocks.length >= 4);
  // 2026-06-22 is exactly two cycles before the anchor → "me" week.
  assert.equal(holderOn(blocks, "2026-06-24")!.holder, "me");
  // The week before that is co-parent's.
  assert.equal(holderOn(blocks, "2026-06-17")!.holder, "coparent");
}

// An override flips exactly one block, marked as swapped.
{
  const blocks = getCustodyBlocks(
    weekOnOff,
    [{ occurrence_start: "2026-07-13", holder: "me" }],
    "2026-07-06",
    "2026-08-02"
  );
  assert.equal(blocks[1].holder, "me");
  assert.equal(blocks[1].patternHolder, "coparent");
  assert.equal(blocks[1].isSwapped, true);
  assert.equal(blocks[0].isSwapped, false);
  assert.equal(blocks[2].holder, "me"); // untouched pattern block
  assert.equal(blocks[2].isSwapped, false);
}

// A redundant override (same as pattern) is not marked swapped.
{
  const blocks = getCustodyBlocks(
    weekOnOff,
    [{ occurrence_start: "2026-07-06", holder: "me" }],
    "2026-07-06",
    "2026-07-12"
  );
  assert.equal(blocks[0].isSwapped, false);
}

// Alternating weekends: Fri–Sun me, then 11 days co-parent.
{
  const weekends: CustodyPattern = {
    anchor_date: "2026-07-10", // a Friday
    cycle: [
      { holder: "me", days: 3 },
      { holder: "coparent", days: 11 },
    ],
  };
  const blocks = getCustodyBlocks(weekends, [], "2026-07-10", "2026-08-06");
  assert.equal(blocks[0].start, "2026-07-10");
  assert.equal(blocks[0].end, "2026-07-12");
  assert.equal(blocks[0].holder, "me");
  assert.equal(blocks[1].end, "2026-07-23");
  assert.equal(blocks[2].start, "2026-07-24"); // next Friday two weeks on
  assert.equal(blocks[2].holder, "me");
}

// Blocks straddling the range edges are included (clipped ranges still report
// their true start/end).
{
  const blocks = getCustodyBlocks(weekOnOff, [], "2026-07-15", "2026-07-16");
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].start, "2026-07-13");
  assert.equal(blocks[0].end, "2026-07-19");
}

// Empty/zero cycles never loop forever.
{
  assert.deepEqual(
    getCustodyBlocks({ anchor_date: "2026-01-01", cycle: [] }, [], "2026-01-01", "2026-02-01"),
    []
  );
  assert.deepEqual(
    getCustodyBlocks(
      { anchor_date: "2026-01-01", cycle: [{ holder: "me", days: 0 }] },
      [],
      "2026-01-01",
      "2026-02-01"
    ),
    []
  );
}

// Month about: David has Holly from the 24th, Harriet takes over on the 24th
// of the next month, and so on.
const monthAbout: CustodyPattern = {
  anchor_date: "2026-06-24",
  cycle: [
    { holder: "me", months: 1 },
    { holder: "coparent", months: 1 },
  ],
};

{
  const blocks = getCustodyBlocks(monthAbout, [], "2026-07-01", "2026-10-31");
  assert.equal(blocks[0].start, "2026-06-24");
  assert.equal(blocks[0].end, "2026-07-23");
  assert.equal(blocks[0].holder, "me");
  assert.equal(blocks[1].start, "2026-07-24");
  assert.equal(blocks[1].end, "2026-08-23");
  assert.equal(blocks[1].holder, "coparent");
  assert.equal(blocks[2].start, "2026-08-24");
  assert.equal(blocks[2].holder, "me");
  assert.equal(holderOn(blocks, "2026-07-08")!.holder, "me"); // today: David has her
  assert.equal(holderOn(blocks, "2026-07-24")!.holder, "coparent");
}

// Monthly works backwards from the anchor too.
{
  const blocks = getCustodyBlocks(monthAbout, [], "2026-01-01", "2026-03-31");
  // Even month-offsets from the June anchor are "me": Dec 24–Jan 23 is -6.
  assert.equal(holderOn(blocks, "2026-01-10")!.holder, "me");
  assert.equal(holderOn(blocks, "2026-02-01")!.holder, "coparent"); // Jan 24–Feb 23
}

// Monthly override flips exactly one block.
{
  const blocks = getCustodyBlocks(
    monthAbout,
    [{ occurrence_start: "2026-07-24", holder: "me" }],
    "2026-07-01",
    "2026-09-30"
  );
  assert.equal(holderOn(blocks, "2026-08-01")!.holder, "me");
  assert.equal(holderOn(blocks, "2026-08-01")!.isSwapped, true);
  assert.equal(holderOn(blocks, "2026-09-01")!.holder, "me"); // pattern, untouched
  assert.equal(holderOn(blocks, "2026-09-01")!.isSwapped, false);
}

// A day-31 anchor clamps in short months without drifting.
{
  const p: CustodyPattern = {
    anchor_date: "2026-01-31",
    cycle: [
      { holder: "me", months: 1 },
      { holder: "coparent", months: 1 },
    ],
  };
  const blocks = getCustodyBlocks(p, [], "2026-01-31", "2026-05-31");
  assert.equal(blocks[0].end, "2026-02-27"); // Feb block starts on the 28th (clamped)
  assert.equal(blocks[1].start, "2026-02-28");
  assert.equal(blocks[1].end, "2026-03-30");
  assert.equal(blocks[2].start, "2026-03-31"); // back on the 31st — no drift
}

console.log("custody.test.ts: all assertions passed ✓");
