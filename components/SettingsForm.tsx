"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, formatShort, today, weekdayMon0, type YMD } from "@/lib/dates";
import { getCustodyBlocks, holderOn } from "@/lib/custody";
import type { Category, CustodyPattern, CycleSegment, Holder } from "@/lib/types";

const mutate = (payload: Record<string, unknown>) =>
  fetch("/api/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((r) => (r.ok ? r.json() : null));

interface SettingsFormProps {
  categories: Category[];
  pattern: CustodyPattern | null;
  activeToken: string | null;
  overrideCount: number;
}

function lastMonday(): YMD {
  const t = today();
  return addDays(t, -weekdayMon0(t));
}

const PRESETS: { label: string; anchor: () => YMD; cycle: CycleSegment[] }[] = [
  {
    label: "Month about (swap on the same date)",
    // Anchor = the date the current block started; edit it below.
    anchor: () => "2026-06-24",
    cycle: [
      { holder: "me", months: 1 },
      { holder: "coparent", months: 1 },
    ],
  },
  {
    label: "Week on / week off",
    anchor: lastMonday,
    cycle: [
      { holder: "me", days: 7 },
      { holder: "coparent", days: 7 },
    ],
  },
  {
    label: "Alternating weekends (Fri–Sun)",
    // Anchor on a Friday: 3 weekend days me, 11 days co-parent → 14-day cycle
    anchor: () => addDays(lastMonday(), 4),
    cycle: [
      { holder: "me", days: 3 },
      { holder: "coparent", days: 11 },
    ],
  },
];

export function SettingsForm({ categories, pattern, activeToken, overrideCount }: SettingsFormProps) {
  const router = useRouter();

  const [anchor, setAnchor] = useState<YMD>(pattern?.anchor_date ?? lastMonday());
  const [cycle, setCycle] = useState<CycleSegment[]>(
    pattern?.cycle ?? PRESETS[0].cycle
  );
  const [token, setToken] = useState(activeToken);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cats, setCats] = useState(categories);

  const custodyColor = (h: Holder) =>
    cats.find((c) => c.is_custody && c.holder === h)?.color ?? "#888";
  const custodyName = (h: Holder) =>
    cats.find((c) => c.is_custody && c.holder === h)?.name ?? h;

  const unit: "days" | "months" = cycle.some((s) => (s.months ?? 0) > 0)
    ? "months"
    : "days";

  function switchUnit(next: "days" | "months") {
    if (next === unit) return;
    setCycle((c) =>
      c.map((s) => ({
        holder: s.holder,
        [next]: next === "months" ? 1 : (s.months ?? 1) * 28,
      }))
    );
  }

  // Live preview — long enough to show a full monthly cycle.
  const previewDays = unit === "months" ? 84 : 56;
  const preview = useMemo(() => {
    const start = lastMonday();
    const days: { day: YMD; holder: Holder | null }[] = [];
    const blocks = getCustodyBlocks(
      { anchor_date: anchor, cycle },
      [],
      start,
      addDays(start, previewDays - 1)
    );
    for (let i = 0; i < previewDays; i++) {
      const day = addDays(start, i);
      days.push({ day, holder: holderOn(blocks, day)?.holder ?? null });
    }
    return days;
  }, [anchor, cycle, previewDays]);

  async function savePattern() {
    if (
      overrideCount > 0 &&
      !confirm(
        `Changing the pattern clears ${overrideCount} existing swap${overrideCount === 1 ? "" : "s"} (they belong to the old block dates). Continue?`
      )
    ) {
      return;
    }
    setSaving(true);
    await mutate({
      kind: "pattern.save",
      anchor_date: anchor,
      cycle,
      clear_overrides: overrideCount > 0,
    });
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
    router.refresh();
  }

  async function rotateToken() {
    if (
      token &&
      !confirm("This deactivates the current link — anyone using it loses access. Continue?")
    ) {
      return;
    }
    const result = await mutate({ kind: "token.rotate" });
    if (result?.token) setToken(result.token as string);
  }

  async function copyLink() {
    if (!token) return;
    await navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveCategory(cat: Category) {
    await mutate({ kind: "category.save", id: cat.id, name: cat.name, color: cat.color });
  }

  async function downloadBackup() {
    const data = await fetch("/api/data").then((r) => (r.ok ? r.json() : null));
    if (!data) return;
    const backup = { exported_at: new Date().toISOString(), ...data };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function setSegment(i: number, patch: Partial<CycleSegment>) {
    setCycle((c) => c.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-8 rise-in">
      <header className="flex items-center gap-4">
        <Link
          href="/"
          className="h-9 px-3 rounded-lg border border-hairline bg-paper-raised hover:bg-paper-sunken transition text-sm font-medium grid place-items-center"
        >
          ← Calendar
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
      </header>

      {/* ---- custody pattern ---- */}
      <section className="rounded-2xl border border-hairline bg-paper-raised shadow-[var(--shadow-soft)] p-5 space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Dog schedule pattern</h2>
          <p className="text-sm text-ink-soft mt-0.5">
            The repeating rhythm. Swap individual blocks right on the calendar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setAnchor(p.anchor());
                setCycle(p.cycle.map((s) => ({ ...s })));
              }}
              className="rounded-full border border-hairline bg-paper px-3 py-1.5 text-sm font-medium text-ink-soft hover:border-hairline-strong transition"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink-soft">Counted in</span>
            <div className="flex rounded-lg border border-hairline bg-paper p-0.5">
              {(["days", "months"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => switchUnit(u)}
                  className={`h-7 px-2.5 rounded-md font-medium transition ${
                    unit === u ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          {cycle.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={seg.holder}
                onChange={(e) => setSegment(i, { holder: e.target.value as Holder })}
                className="rounded-xl border border-hairline bg-paper px-3 py-2 text-sm"
              >
                <option value="me">{custodyName("me")}</option>
                <option value="coparent">{custodyName("coparent")}</option>
              </select>
              <input
                type="number"
                min={1}
                max={unit === "months" ? 12 : 60}
                value={unit === "months" ? (seg.months ?? 1) : (seg.days ?? 1)}
                onChange={(e) =>
                  setSegment(i, { [unit]: Math.max(1, Number(e.target.value)) })
                }
                className="w-20 rounded-xl border border-hairline bg-paper px-3 py-2 text-sm tabular-nums"
              />
              <span className="text-sm text-ink-soft">
                {unit === "months" ? "calendar month(s)" : "days"}
              </span>
              {cycle.length > 1 && (
                <button
                  onClick={() => setCycle((c) => c.filter((_, j) => j !== i))}
                  className="ml-auto text-sm text-ink-faint hover:text-today transition"
                  aria-label="Remove segment"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() =>
              setCycle((c) => [...c, { holder: "me", [unit]: unit === "months" ? 1 : 7 }])
            }
            className="text-sm font-medium text-ink-soft hover:text-ink transition"
          >
            + Add segment
          </button>
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Pattern starts on (first “{custodyName(cycle[0]?.holder ?? "me")}” day)
          </span>
          <input
            type="date"
            value={anchor}
            onChange={(e) => e.target.value && setAnchor(e.target.value)}
            className="mt-1 rounded-xl border border-hairline bg-paper px-3 py-2.5 text-sm"
          />
        </label>

        {/* preview */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Next 8 weeks
          </span>
          <div className="mt-1.5 grid grid-cols-7 gap-[3px] max-w-[420px]">
            {preview.map(({ day, holder }) => (
              <div
                key={day}
                title={`${formatShort(day)} — ${holder ? custodyName(holder) : "—"}`}
                className="h-5 rounded-[4px]"
                style={{
                  background: holder ? custodyColor(holder) : "var(--paper-sunken)",
                  opacity: holder ? 0.8 : 1,
                }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex gap-3 text-xs text-ink-soft">
            {(["me", "coparent"] as Holder[]).map((h) => (
              <span key={h} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: custodyColor(h) }} />
                {custodyName(h)}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={savePattern}
          disabled={saving}
          className="rounded-xl bg-ink text-paper px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : savedFlash ? "Saved ✓" : "Save pattern"}
        </button>
      </section>

      {/* ---- share link ---- */}
      <section className="rounded-2xl border border-hairline bg-paper-raised shadow-[var(--shadow-soft)] p-5 space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Share link</h2>
          <p className="text-sm text-ink-soft mt-0.5">
            A read-only link for your co-parent: the dog schedule in full, everything else
            just shows as “Busy”.
          </p>
        </div>
        {token ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-xl border border-hairline bg-paper px-3 py-2.5 text-xs text-ink-soft">
                /share/{token}
              </code>
              <button
                onClick={copyLink}
                className="rounded-xl bg-ink text-paper px-4 py-2.5 text-sm font-medium hover:opacity-90 transition shrink-0"
              >
                {copied ? "Copied ✓" : "Copy link"}
              </button>
            </div>
            <button
              onClick={rotateToken}
              className="text-sm font-medium text-ink-soft hover:text-today transition"
            >
              Deactivate &amp; create a new link
            </button>
          </div>
        ) : (
          <button
            onClick={rotateToken}
            className="rounded-xl bg-ink text-paper px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
          >
            Create share link
          </button>
        )}
      </section>

      {/* ---- categories ---- */}
      <section className="rounded-2xl border border-hairline bg-paper-raised shadow-[var(--shadow-soft)] p-5 space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Colors &amp; names</h2>
          <p className="text-sm text-ink-soft mt-0.5">Changes save as you edit.</p>
        </div>
        <div className="space-y-2">
          {cats.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <input
                type="color"
                value={c.color}
                onChange={(e) => {
                  const updated = { ...c, color: e.target.value };
                  setCats((cs) => cs.map((x) => (x.id === c.id ? updated : x)));
                }}
                onBlur={() => saveCategory(cats.find((x) => x.id === c.id)!)}
                className="h-9 w-9 rounded-lg border border-hairline bg-paper cursor-pointer"
              />
              <input
                value={c.name}
                onChange={(e) => {
                  const updated = { ...c, name: e.target.value };
                  setCats((cs) => cs.map((x) => (x.id === c.id ? updated : x)));
                }}
                onBlur={() => saveCategory(cats.find((x) => x.id === c.id)!)}
                className="flex-1 rounded-xl border border-hairline bg-paper px-3 py-2 text-sm"
              />
              {c.is_custody && (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  dog
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---- your data ---- */}
      <section className="rounded-2xl border border-hairline bg-paper-raised shadow-[var(--shadow-soft)] p-5 space-y-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Your data</h2>
          <p className="text-sm text-ink-soft mt-0.5">
            Everything lives in your private database in the cloud (so your phone and
            Harriet&rsquo;s link work). Download a local copy any time.
          </p>
        </div>
        <button
          onClick={downloadBackup}
          className="rounded-xl border border-hairline bg-paper px-5 py-2.5 text-sm font-medium hover:bg-paper-sunken transition"
        >
          Download my data (JSON)
        </button>
      </section>

    </main>
  );
}
