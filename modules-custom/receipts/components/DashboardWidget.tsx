"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api-base";

interface VerifyResult {
  ok: boolean;
  brokenAtSeq?: number;
}

const KIND_ORDER = ["answer", "refusal", "trust", "action"] as const;

const KIND_DOT: Record<string, string> = {
  answer: "bg-emerald-500",
  refusal: "bg-amber-500",
  trust: "bg-violet-500",
  action: "bg-blue-500",
};

export function DashboardWidget() {
  const [v, setV] = useState<VerifyResult | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/list`)
      .then((r) => r.json())
      .then(
        (d: { verify: VerifyResult; counts: Record<string, number> }) => {
          setV(d.verify);
          setCounts(d.counts);
        }
      )
      .catch(() => {});
  }, []);

  return (
    <a
      href="/aria"
      className="block rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="text-xs font-medium uppercase tracking-widest text-neutral-400">
        ARIA
      </div>
      <div
        className={`mt-2 text-3xl font-bold ${
          v?.ok
            ? "text-emerald-600"
            : v
            ? "text-red-600"
            : "text-neutral-400"
        }`}
      >
        {v ? (v.ok ? "✓ Verified" : `✗ Broken #${v.brokenAtSeq}`) : "…"}
      </div>
      {counts !== null && (
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          {KIND_ORDER.filter((k) => (counts[k] ?? 0) > 0).map((k) => (
            <div key={k} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${KIND_DOT[k]}`} />
              <span className="text-xs text-neutral-500">
                {counts[k]} {k}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 text-xs text-neutral-400">
        Cited answers · gated actions · tamper-evident
      </div>
      {v && !v.ok && (
        <div className="mt-1 text-xs text-blue-500 underline">
          Open verifier →
        </div>
      )}
    </a>
  );
}
