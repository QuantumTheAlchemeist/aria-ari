"use client";
import { useState } from "react";
import { scenariosForScan, type SimScenario, type SimResult } from "@receipts/lib/policy-sim";
import type { ModuleRiskScan } from "@receipts/lib/module-scan";
import { API_BASE } from "../lib/api-base";

// ---- colour maps ----------------------------------------------------------------

const DECISION_BADGE: Record<string, string> = {
  act: "bg-emerald-100 text-emerald-800",
  draft: "bg-amber-100 text-amber-800",
  refuse: "bg-red-100 text-red-800",
};

const DECISION_BORDER: Record<string, string> = {
  act: "border-emerald-200 bg-emerald-50",
  draft: "border-amber-200 bg-amber-50",
  refuse: "border-red-200 bg-red-50",
};

function decisionLabel(result: SimResult): string {
  if (result.decision.decision === "act") return "✓ Act";
  if (result.decision.decision === "refuse") return "✗ Refuse";
  return `⏸ Draft · ${result.decision.tier}`;
}

// ---- scenario chip --------------------------------------------------------------

function ScenarioChip({
  scenario,
  selected,
  loading,
  onClick,
}: {
  scenario: SimScenario;
  selected: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={scenario.description}
      className={[
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        "disabled:opacity-50",
        selected
          ? "bg-neutral-900 text-white border-neutral-900"
          : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-400",
      ].join(" ")}
    >
      {loading && selected ? "…" : scenario.label}
    </button>
  );
}

// ---- result card ----------------------------------------------------------------

function ResultCard({ result }: { result: SimResult }) {
  const d = result.decision.decision;
  return (
    <div className={`rounded-lg border p-3 space-y-2 ${DECISION_BORDER[d] ?? "border-neutral-200 bg-neutral-50"}`}>
      {/* header row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${DECISION_BADGE[d] ?? ""}`}>
          {decisionLabel(result)}
        </span>
        <span className="text-xs font-medium text-neutral-700 truncate">
          {result.scenario.label}
        </span>
      </div>

      {/* reason */}
      <p className="text-xs text-neutral-700 leading-relaxed">{result.decision.reason}</p>

      {/* policy line */}
      <pre className="text-[11px] rounded bg-white/70 border border-neutral-200 px-2 py-1 text-neutral-500 font-mono whitespace-pre-wrap">
        {result.policyLine}
      </pre>

      {/* preview */}
      {result.decision.preview && (
        <p className="text-xs text-neutral-500 italic">{result.decision.preview}</p>
      )}
    </div>
  );
}

// ---- main component -------------------------------------------------------------

interface PolicySimulatorProps {
  scannedModule: ModuleRiskScan | null;
}

export function PolicySimulator({ scannedModule }: PolicySimulatorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, SimResult>>({});
  const [error, setError] = useState<string>("");

  if (!scannedModule) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-sm">Policy Simulator</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Scan a module first — the simulator will show how ARIA's policy engine would respond to
          requests from it.
        </p>
      </div>
    );
  }

  const scenarios = scenariosForScan(scannedModule);

  async function runScenario(scenario: SimScenario) {
    setSelectedId(scenario.id);
    setError("");

    if (results[scenario.id]) {
      // already fetched — just show it
      return;
    }

    setLoadingId(scenario.id);
    try {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      if (!res.ok) {
        setError("Simulation request failed — check the server logs.");
        return;
      }
      const data: SimResult = await res.json();
      setResults((prev) => ({ ...prev, [scenario.id]: data }));
    } catch {
      setError("Network error — could not reach the simulate endpoint.");
    } finally {
      setLoadingId(null);
    }
  }

  const activeResult = selectedId ? results[selectedId] : null;

  return (
    <div className="rounded-xl border bg-white p-4 space-y-4 shadow-sm">
      {/* header */}
      <div>
        <h3 className="font-semibold text-sm">Policy Simulator</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          See how ARIA&apos;s policy engine responds to requests from this module — before trusting it.
        </p>
      </div>

      {/* scenario chips */}
      <div className="flex flex-wrap gap-2">
        {scenarios.map((s) => (
          <ScenarioChip
            key={s.id}
            scenario={s}
            selected={selectedId === s.id}
            loading={loadingId === s.id}
            onClick={() => runScenario(s)}
          />
        ))}
      </div>

      {/* error */}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* result */}
      {activeResult && <ResultCard result={activeResult} />}

      {/* loading state with no cached result yet */}
      {loadingId && !results[loadingId] && (
        <p className="text-xs text-neutral-400 animate-pulse">Simulating…</p>
      )}
    </div>
  );
}
