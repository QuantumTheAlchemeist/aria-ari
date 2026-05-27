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

  async function ask() {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
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
    <div className="rounded-xl border bg-white p-4 space-y-3 shadow-sm">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Ask ARIA about your notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          disabled={loading}
        />
        <button
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white font-medium disabled:opacity-50 hover:bg-emerald-700 transition-colors"
          onClick={ask}
          disabled={loading || !q.trim()}
        >
          {loading ? "…" : "Ask"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md p-2">{error}</p>
      )}

      {res && (
        <div
          className={`rounded-md p-3 text-sm ${
            isRefusal
              ? "bg-amber-50 text-amber-900 border border-amber-300"
              : "bg-neutral-50 border text-neutral-900"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-bold uppercase tracking-wide ${
                isRefusal ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {isRefusal ? "⚠ Refusal" : "✓ Cited Answer"}
            </span>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">{res.result.text}</p>
          {res.result.citations.length > 0 && (
            <ol className="mt-2 list-decimal pl-5 text-xs text-neutral-500 space-y-1">
              {res.result.citations.map((c, i) => (
                <li key={i}>
                  <span className="font-medium text-neutral-700">{c.title}</span>
                  : {c.snippet}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
