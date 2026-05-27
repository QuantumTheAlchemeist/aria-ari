"use client";
import { useState } from "react";
import { API_BASE } from "../lib/api-base";

interface Citation {
  id: string;
  title: string;
  snippet: string;
}

interface AskResult {
  kind: "answer" | "refusal";
  text: string;
  citations: Citation[];
}

interface AskResponse {
  result: AskResult;
}

export function AskPanel({ onReceipt }: { onReceipt: () => void }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citationsOpen, setCitationsOpen] = useState(false);

  async function ask() {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setCitationsOpen(false);
    try {
      const r = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setError((e as { error?: string }).error ?? "Request failed");
        return;
      }
      setRes(await r.json());
      onReceipt();
    } catch {
      setError("Network error — is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  const isRefusal = res?.result.kind === "refusal";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
          Ask ARIA
        </p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 transition-colors"
            placeholder="Ask about your notes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            disabled={loading}
          />
          <button
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white font-medium disabled:opacity-40 hover:bg-emerald-500 transition-colors"
            onClick={ask}
            disabled={loading || !q.trim()}
          >
            {loading ? "…" : "Ask →"}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">
            {error}
          </p>
        )}

        {res && (
          <div
            className={`rounded-lg border border-neutral-200 bg-white overflow-hidden ${
              isRefusal
                ? "border-l-4 border-l-amber-500"
                : "border-l-4 border-l-emerald-500"
            }`}
          >
            <div className="p-4 space-y-2">
              <span
                className={`text-xs font-bold uppercase tracking-widest ${
                  isRefusal ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {isRefusal ? "⚠ Refusal" : "✓ Cited Answer"}
              </span>
              <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                {res.result.text}
              </p>
              {res.result.citations.length > 0 && (
                <div>
                  <button
                    className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-1"
                    onClick={() => setCitationsOpen((x) => !x)}
                  >
                    {citationsOpen ? "▲" : "▼"} {res.result.citations.length}{" "}
                    source{res.result.citations.length !== 1 ? "s" : ""}
                  </button>
                  {citationsOpen && (
                    <ol className="mt-2 space-y-1 pl-4 list-decimal">
                      {res.result.citations.map((c, i) => (
                        <li key={i} className="text-xs text-neutral-500">
                          <span className="font-medium text-neutral-700">
                            {c.title}
                          </span>
                          : {c.snippet}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
