"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api-base";

interface VerifyResult {
  ok: boolean;
  brokenAtSeq?: number;
}

const KIND_ORDER = ["answer", "refusal", "trust", "action"] as const;

function buildBreakdown(counts: Record<string, number>): string {
  const parts = KIND_ORDER.filter((k) => (counts[k] ?? 0) > 0).map(
    (k) => `${counts[k]} ${k}`
  );
  return parts.join(" · ");
}

export function DashboardWidget() {
  const [v, setV] = useState<VerifyResult | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/list`)
      .then((r) => r.json())
      .then((d: { verify: VerifyResult; counts: Record<string, number> }) => {
        setV(d.verify);
        setCounts(d.counts);
      })
      .catch(() => {});
  }, []);

  const breakdown =
    counts !== null ? buildBreakdown(counts) : null;

  return (
    <a
      href="/aria"
      className="block rounded-xl border bg-white p-4 hover:shadow-md transition-shadow"
    >
      <div className="text-sm font-semibold text-neutral-700">ARIA</div>
      <div
        className={`mt-1 text-2xl font-bold ${
          v?.ok ? "text-emerald-600" : v ? "text-red-600" : "text-neutral-400"
        }`}
      >
        {v
          ? v.ok
            ? "✓ All verified"
            : `✗ Broken #${v.brokenAtSeq}`
          : "…"}
      </div>
      {breakdown !== null && breakdown.length > 0 && (
        <div className="mt-0.5 text-xs text-neutral-400">{breakdown}</div>
      )}
      {v && !v.ok && (
        <div className="mt-0.5 text-xs text-blue-500 underline">
          Open verifier →
        </div>
      )}
      <div className="mt-1 text-xs text-neutral-500">
        Cited answers · gated actions · tamper-evident
      </div>
    </a>
  );
}
