"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api-base";

interface VerifyResult {
  ok: boolean;
  brokenAtSeq?: number;
}

export function DashboardWidget() {
  const [v, setV] = useState<VerifyResult | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/list`)
      .then((r) => r.json())
      .then((d: { verify: VerifyResult; receipts: unknown[] }) => {
        setV(d.verify);
        setCount(d.receipts.length);
      })
      .catch(() => {});
  }, []);

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
      {count !== null && (
        <div className="mt-0.5 text-xs text-neutral-400">
          {count} receipt{count !== 1 ? "s" : ""} in ledger
        </div>
      )}
      <div className="mt-1 text-xs text-neutral-500">
        Cited answers · gated actions · tamper-evident
      </div>
    </a>
  );
}
