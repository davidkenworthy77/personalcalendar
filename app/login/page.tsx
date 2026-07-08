"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const linkError = params.get("error") === "link";

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rise-in">
        <h1 className="font-display text-5xl font-semibold tracking-tight mb-2">Glance</h1>
        <p className="text-ink-soft mb-8">Your year, at a glance.</p>

        {status === "sent" ? (
          <div className="rounded-xl border border-hairline bg-paper-raised p-5 shadow-[var(--shadow-soft)]">
            <p className="font-medium mb-1">Check your email</p>
            <p className="text-sm text-ink-soft">
              A sign-in link is on its way to {email}. Open it on this device.
            </p>
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-3">
            {linkError && (
              <p className="text-sm text-today">
                That link expired or was already used — send a fresh one.
              </p>
            )}
            <input
              type="email"
              required
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-hairline bg-paper-raised px-4 py-3 outline-none focus:border-hairline-strong focus:ring-2 focus:ring-today/15"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-xl bg-ink text-paper px-4 py-3 font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {status === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-today">Couldn’t send the link — try again in a minute.</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
