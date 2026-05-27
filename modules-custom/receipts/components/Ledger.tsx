"use client";
import { useEffect, useState, useCallback } from "react";
import { API_BASE } from "../lib/api-base";
import { ReceiptTimeline } from "./ReceiptTimeline";

interface Receipt {
  seq: number;
  kind: string;
  decision: string | null;
  prompt: string;
  receipt_hash: string;
  created_at: string;
}

interface VerifyResult {
  ok: boolean;
  brokenAtSeq?: number;
  reason?: string;
}

interface ListResponse {
  receipts: Receipt[];
  verify: VerifyResult;
}

const KIND_COLOR: Record<string, string> = {
  answer: "text-emerald-700",
  refusal: "text-amber-700",
  action: "text-blue-700",
};

export function Ledger({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/list`);
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [refreshKey, load]);

  const seed = async () => {
    setActionError("");
    try {
      const r = await fetch(`${API_BASE}/seed`, { method: "POST" });
      if (!r.ok) setActionError("Seed failed");
      else load();
    } catch {
      setActionError("Network error during seed");
    }
  };

  const tamper = async () => {
    setActionError("");
    try {
      const r = await fetch(`${API_BASE}/tamper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seq: 1 }),
      });
      if (!r.ok) setActionError("Tamper failed");
      else load();
    } catch {
      setActionError("Network error during tamper");
    }
  };

  const verify = data?.verify;
  const broken = verify && !verify.ok ? verify.brokenAtSeq : -1;

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm">ARIA Ledger</h3>
        {loading && (
          <span className="text-xs text-neutral-400">Loading…</span>
        )}
        <span
          className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
            verify?.ok
              ? "bg-emerald-100 text-emerald-800"
              : verify
              ? "bg-red-100 text-red-800"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {verify
            ? verify.ok
              ? "✓ Verified"
              : `✗ Broken at #${verify.brokenAtSeq}`
            : "…"}
        </span>
      </div>

      {verify && !verify.ok && (
        <p className="text-xs text-red-700 bg-red-50 rounded p-2">
          {verify.reason}
        </p>
      )}

      {actionError && (
        <p className="text-xs text-red-600 bg-red-50 rounded p-2">{actionError}</p>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-neutral-50 transition-colors"
          onClick={seed}
        >
          Seed demo
        </button>
        <button
          className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-neutral-50 transition-colors"
          onClick={load}
        >
          Verify
        </button>
        <button
          className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
          onClick={tamper}
        >
          Tamper (demo)
        </button>
      </div>

      {data?.receipts.length === 0 && (
        <p className="text-sm text-neutral-400 py-2">
          No receipts yet. Click &quot;Seed demo&quot; then ask a question.
        </p>
      )}

      {data?.receipts && data.receipts.length > 0 && (
        <ReceiptTimeline receipts={data.receipts} brokenAtSeq={broken ?? -1} />
      )}

      <ul className="divide-y text-sm">
        {data?.receipts.map((r) => (
          <li
            key={r.receipt_hash}
            className={`py-2 ${
              r.seq === broken
                ? "bg-red-50 -mx-2 px-2 rounded"
                : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">#{r.seq}</span>
              <span
                className={`text-xs font-medium uppercase tracking-wide ${
                  KIND_COLOR[r.kind] ?? "text-neutral-600"
                }`}
              >
                {r.kind}
                {r.decision ? ` · ${r.decision}` : ""}
              </span>
              {r.seq === broken && (
                <span className="text-xs font-bold text-red-700 bg-red-100 rounded px-1">
                  TAMPERED
                </span>
              )}
              <span className="ml-auto font-mono text-[10px] text-neutral-400">
                {r.receipt_hash.slice(0, 16)}…
              </span>
            </div>
            <p className="mt-0.5 truncate text-neutral-700">{r.prompt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
