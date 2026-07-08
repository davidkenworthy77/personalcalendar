"use client";

import { useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/types";

async function mutate(payload: Record<string, unknown>) {
  const res = await fetch("/api/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    alert(body?.error === "category in use"
      ? "That color is still used by events on the calendar — recolor or delete those first."
      : "That change didn't save. Check your connection and try again.");
    return null;
  }
  return res.json();
}

const NEW_COLOR_POOL = ["#B5764C", "#5B8A72", "#A85D8A", "#6B8CAE", "#9C8B3F"];

interface SettingsFormProps {
  categories: Category[];
  activeToken: string | null;
}

export function SettingsForm({ categories, activeToken }: SettingsFormProps) {
  const [cats, setCats] = useState(categories);
  const [token, setToken] = useState(activeToken);
  const [copied, setCopied] = useState(false);

  async function saveCategory(cat: Category) {
    await mutate({ kind: "category.save", id: cat.id, name: cat.name, color: cat.color });
  }

  async function addCategory() {
    const color = NEW_COLOR_POOL[cats.length % NEW_COLOR_POOL.length];
    const result = await mutate({ kind: "category.add", name: "New color", color });
    if (result?.id) {
      setCats((cs) => [
        ...cs,
        { id: result.id, name: "New color", color, is_custody: false, sort: result.sort },
      ]);
    }
  }

  async function deleteCategory(id: number) {
    const result = await mutate({ kind: "category.delete", id });
    if (result) setCats((cs) => cs.filter((c) => c.id !== id));
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

  async function downloadBackup() {
    const data = await fetch("/api/data").then((r) => (r.ok ? r.json() : null));
    if (!data) {
      alert("Couldn't fetch your data — try again.");
      return;
    }
    const backup = { exported_at: new Date().toISOString(), ...data };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

      {/* ---- colors ---- */}
      <section className="rounded-2xl border border-hairline bg-paper-raised shadow-[var(--shadow-soft)] p-5 space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Colors</h2>
          <p className="text-sm text-ink-soft mt-0.5">
            Every event gets one of these. The two marked <em>shared</em> are the Holly
            colors — events in them show in full on Harriet&rsquo;s link; everything else
            appears there only as &ldquo;Busy&rdquo;. Changes save as you edit.
          </p>
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
              {c.is_custody ? (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  shared
                </span>
              ) : (
                <button
                  onClick={() => deleteCategory(c.id)}
                  aria-label={`Delete ${c.name}`}
                  className="text-sm text-ink-faint hover:text-today transition"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addCategory}
          className="rounded-xl border border-dashed border-hairline-strong px-4 py-2 text-sm font-medium text-ink-soft hover:bg-paper-sunken transition"
        >
          + Add a color
        </button>
      </section>

      {/* ---- share link ---- */}
      <section className="rounded-2xl border border-hairline bg-paper-raised shadow-[var(--shadow-soft)] p-5 space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Share link</h2>
          <p className="text-sm text-ink-soft mt-0.5">
            Read-only for Harriet: the Holly schedule in full, everything else just
            &ldquo;Busy&rdquo;.
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
