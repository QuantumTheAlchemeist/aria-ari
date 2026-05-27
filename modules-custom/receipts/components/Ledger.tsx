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
  counts: Record<string, number>;
}

const KIND_COLOR: Record<string, string> = {
  answer: "text-emerald-700",
  refusal: "text-amber-700",
  action: "text-blue-700",
  trust: "text-purple-700",
};

type ProofPhase = "idle" | "proving" | "broken" | "restoring";

export function Ledger({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [proofPhase, setProofPhase] = useState<ProofPhase>("idle");
  const [proofError, setProofError] = useState("");

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

  const verify = data?.verify;
  const broken = verify && !verify.ok ? verify.brokenAtSeq : -1;
  const receipts = data?.receipts ?? [];

  async function runIntegrityProof() {
    setProofPhase("proving");
    setProofError("");
    const target = receipts.length > 1 ? receipts[1].seq : (receipts[0]?.seq ?? 0);
    try {
      const r = await fetch(`${API_BASE}/tamper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seq: target }),
      });
      if (!r.ok) {
        const msg = await r.json().catch(() => ({}));
        setProofError((msg as { error?: string }).error ?? "Proof failed");
        setProofPhase("idle");
        return;
      }
      await load();
      setProofPhase("broken");
    } catch {
      setProofError("Network error");
      setProofPhase("idle");
    }
  }

  async function restoreChain() {
    setProofPhase("restoring");
    setProofError("");
    try {
      await fetch(`${API_BASE}/seed`, { method: "POST" });
      await load();
      setProofPhase("idle");
    } catch {
      setProofError("Restore failed — reload the page");
      setProofPhase("idle");
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm">Receipt Ledger</h3>
        {loading && <span className="text-xs text-neutral-400">Loading…</span>}
        <button
          className="ml-auto text-xs text-neutral-500 hover:text-neutral-700 border rounded px-2 py-1 transition-colors"
          onClick={load}
        >
          Verify
        </button>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            verify?.ok
              ? "bg-emerald-100 text-emerald-800"
              : verify
              ? "bg-red-100 text-red-800"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {verify ? (verify.ok ? "✓ Verified" : `✗ Broken at #${verify.brokenAtSeq}`) : "…"}
        </span>
      </div>

      {/* Chain break explanation */}
      {verify && !verify.ok && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-800 space-y-1">
          <p className="font-semibold">Chain integrity failure</p>
          <p>{verify.reason}</p>
          <p className="text-red-600 opacity-80">
            SHA-256 recomputation of receipt #{verify.brokenAtSeq} does not match its stored hash.
            Any edit — no matter how small — produces a completely different hash.
          </p>
        </div>
      )}

      {/* Empty state */}
      {receipts.length === 0 && (
        <p className="text-sm text-neutral-400 py-2">
          No receipts yet. Add sources above, then ask a question.
        </p>
      )}

      {/* Timeline */}
      {receipts.length > 0 && (
        <ReceiptTimeline receipts={receipts} brokenAtSeq={broken ?? -1} />
      )}

      {/* Receipt list */}
      <ul className="divide-y text-sm">
        {receipts.map((r) => (
          <li
            key={r.receipt_hash}
            className={`py-2 ${r.seq === broken ? "bg-red-50 -mx-2 px-2 rounded" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">#{r.seq}</span>
              <span className={`text-xs font-medium uppercase tracking-wide ${KIND_COLOR[r.kind] ?? "text-neutral-600"}`}>
                {r.kind}{r.decision ? ` · ${r.decision}` : ""}
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

      {/* Integrity proof section — only shown when chain has receipts */}
      {receipts.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Integrity Proof
            </p>
          </div>

          {proofPhase === "idle" && verify?.ok && (
            <div className="space-y-1">
              <p className="text-xs text-neutral-500">
                Simulate a silent edit to one receipt — ARIA will detect the SHA-256 mismatch
                and flag the exact broken entry.
              </p>
              <button
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                onClick={runIntegrityProof}
              >
                Simulate edit →
              </button>
            </div>
          )}

          {proofPhase === "proving" && (
            <p className="text-xs text-neutral-400 animate-pulse">Simulating edit…</p>
          )}

          {proofPhase === "broken" && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-2">
              <p className="text-xs font-semibold text-red-800">
                ✓ Tamper detected — chain integrity proof passed
              </p>
              <p className="text-xs text-red-700">
                One receipt was silently edited without resealing. ARIA recomputed the hash
                chain and pinpointed the exact broken entry above.
              </p>
              <button
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white font-medium hover:bg-emerald-700 transition-colors"
                onClick={restoreChain}
              >
                Restore chain →
              </button>
            </div>
          )}

          {proofPhase === "restoring" && (
            <p className="text-xs text-neutral-400 animate-pulse">Restoring chain…</p>
          )}

          {proofError && (
            <p className="text-xs text-red-600">{proofError}</p>
          )}
        </div>
      )}
    </div>
  );
}
