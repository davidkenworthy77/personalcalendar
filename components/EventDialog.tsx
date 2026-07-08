"use client";

import { useState } from "react";
import type { YMD } from "@/lib/dates";
import type { Category } from "@/lib/types";

export interface EventDraft {
  id?: string;
  title?: string;
  category_id?: number;
  start_date: YMD;
  end_date: YMD;
  notes?: string;
}

interface EventDialogProps {
  draft: EventDraft;
  categories: Category[];
  onSave: (values: {
    id?: string;
    title: string;
    category_id: number;
    start_date: YMD;
    end_date: YMD;
    notes: string;
  }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function EventDialog({ draft, categories, onSave, onDelete, onClose }: EventDialogProps) {
  const [title, setTitle] = useState(draft.title ?? "");
  const [categoryId, setCategoryId] = useState(draft.category_id ?? categories[0]?.id ?? 3);
  const [start, setStart] = useState(draft.start_date);
  const [end, setEnd] = useState(draft.end_date);
  const [notes, setNotes] = useState(draft.notes ?? "");
  const isEdit = Boolean(draft.id);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: draft.id,
      title: title.trim(),
      category_id: categoryId,
      start_date: start,
      end_date: end,
      notes: notes.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="pop-in w-full sm:max-w-md bg-paper-raised rounded-t-2xl sm:rounded-2xl border border-hairline shadow-[var(--shadow-pop)] p-5 space-y-4"
      >
        <h2 className="font-display text-2xl font-semibold">
          {isEdit ? "Edit event" : "New event"}
        </h2>

        <input
          autoFocus
          placeholder="What is it?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-hairline bg-paper px-4 py-3 text-base outline-none focus:border-hairline-strong focus:ring-2 focus:ring-today/15"
        />

        {/* category chips */}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                categoryId === c.id
                  ? "border-transparent text-white shadow-sm"
                  : "border-hairline bg-paper text-ink-soft hover:border-hairline-strong"
              }`}
              style={categoryId === c.id ? { background: c.color } : undefined}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: categoryId === c.id ? "rgba(255,255,255,0.85)" : c.color }}
              />
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">From</span>
            <input
              type="date"
              required
              value={start}
              onChange={(e) => e.target.value && setStart(e.target.value)}
              className="mt-1 w-full rounded-xl border border-hairline bg-paper px-3 py-2.5 outline-none focus:border-hairline-strong"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">To</span>
            <input
              type="date"
              required
              value={end}
              min={start}
              onChange={(e) => e.target.value && setEnd(e.target.value)}
              className="mt-1 w-full rounded-xl border border-hairline bg-paper px-3 py-2.5 outline-none focus:border-hairline-strong"
            />
          </label>
        </div>

        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-hairline bg-paper px-4 py-3 text-sm outline-none focus:border-hairline-strong resize-none"
        />

        <div className="flex items-center gap-2 pt-1">
          {isEdit && (
            <button
              type="button"
              onClick={() => onDelete(draft.id!)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-today hover:bg-today/10 transition"
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-paper-sunken transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-ink text-paper px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
          >
            {isEdit ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
