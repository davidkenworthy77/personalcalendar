"use client";

import { useState } from "react";
import { formatRange } from "@/lib/dates";
import type { CustodyBlock, Holder } from "@/lib/types";

interface SwapDialogProps {
  block: CustodyBlock;
  custodyName: (h: Holder) => string;
  custodyColor: (h: Holder) => string;
  onSwap: (block: CustodyBlock, note: string) => void;
  onClose: () => void;
}

export function SwapDialog({ block, custodyName, custodyColor, onSwap, onClose }: SwapDialogProps) {
  const [note, setNote] = useState("");
  const other: Holder = block.holder === "me" ? "coparent" : "me";
  const revertsToPattern = other === block.patternHolder;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pop-in w-full sm:max-w-sm bg-paper-raised rounded-t-2xl sm:rounded-2xl border border-hairline shadow-[var(--shadow-pop)] p-5 space-y-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: custodyColor(block.holder) }}
            />
            <h2 className="font-display text-xl font-semibold">{custodyName(block.holder)}</h2>
            {block.isSwapped && (
              <span className="text-[11px] font-semibold uppercase tracking-wide rounded-full bg-paper-sunken px-2 py-0.5 text-ink-soft">
                swapped
              </span>
            )}
          </div>
          <p className="text-sm text-ink-soft mt-1">{formatRange(block.start, block.end)}</p>
        </div>

        {!revertsToPattern && (
          <input
            placeholder="Note (optional) — e.g. covering their trip"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm outline-none focus:border-hairline-strong"
          />
        )}

        <div className="space-y-2">
          <button
            onClick={() => onSwap(block, note)}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105"
            style={{ background: custodyColor(other) }}
          >
            {revertsToPattern
              ? `Revert to pattern (${custodyName(other)})`
              : `Swap this block to ${custodyName(other)}`}
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-paper-sunken transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
