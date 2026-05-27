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

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff)) return "";
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  } catch {
    return "";
  }
}

const KIND_BADGE: Record<string, string> = {
  answer: "bg-emerald-100 text-emerald-800",
  refusal: "bg-amber-100 text-amber-800",
  action: "bg-blue-100 text-blue-800",
  trust: "bg-violet-100 text-violet-800",
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
  const broken = verify && !verify.ok ? (verify.brokenAtSeq ?? -1) : -1;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight text-neutral-900">
          ARIA Ledger
        </span>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-neutral-400">Loading…</span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                : `✗ Broken #${verify.brokenAtSeq}`
              : "…"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            className="text-xs border border-neutral-200 rounded-md px-2.5 py-1 hover:bg-neutral-50 transition-colors"
            onClick={seed}
          >
            Seed demo
          </button>
          <button
            className="text-xs border border-neutral-200 rounded-md px-2.5 py-1 hover:bg-neutral-50 transition-colors"
            onClick={load}
          >
            Verify
          </button>
          <button
            className="text-xs border border-red-200 rounded-md px-2.5 py-1 text-red-700 hover:bg-red-50 transition-colors"
            onClick={tamper}
          >
            Tamper (demo)
          </button>
        </div>

        {verify && !verify.ok && (
          <p className="text-xs text-red-700 bg-red-50 rounded-lg p-2">
            {verify.reason}
          </p>
        )}
        {actionError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
            {actionError}
          </p>
        )}

        {/* Hero chain */}
        {data?.receipts && data.receipts.length > 0 && (
          <ReceiptTimeline
            receipts={data.receipts}
            brokenAtSeq={broken}
          />
        )}

        {/* Empty state */}
        {(!data || data.receipts.length === 0) && !loading && (
          <p className="text-sm text-neutral-400 py-2">
            No receipts yet — click Seed demo to begin.
          </p>
        )}

        {/* Detail list */}
        {data?.receipts && data.receipts.length > 0 && (
          <div>
            {data.receipts.map((r) => (
              <div
                key={r.receipt_hash}
                className={`flex items-center gap-2 py-2 px-1 rounded-md hover:bg-neutral-50 transition-colors ${
                  r.seq === broken ? "bg-red-50" : ""
                }`}
              >
                <span className="font-mono text-xs text-neutral-400 w-8 shrink-0">
                  #{r.seq}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                    KIND_BADGE[r.kind] ?? "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {r.kind}
                  {r.decision ? ` · ${r.decision}` : ""}
                </span>
                {r.seq === broken && (
                  <span className="text-[10px] font-bold text-red-700 bg-red-100 rounded px-1 shrink-0">
                    TAMPERED
                  </span>
                )}
                <span className="text-sm text-neutral-700 truncate flex-1 min-w-0">
                  {r.prompt}
                </span>
                <span className="font-mono text-[10px] text-neutral-400 shrink-0 hidden sm:inline">
                  {r.receipt_hash.slice(0, 16)}…
                </span>
                <span className="text-[10px] text-neutral-400 shrink-0">
                  {formatRelative(r.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
