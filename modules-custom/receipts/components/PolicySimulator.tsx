"use client";
import { useState } from "react";
import {
  scenariosForScan,
  type SimScenario,
  type SimResult,
} from "@receipts/lib/policy-sim";
import type { ModuleRiskScan } from "@receipts/lib/module-scan";
import { API_BASE } from "../lib/api-base";

const DECISION_BADGE: Record<string, string> = {
  act: "bg-emerald-100 text-emerald-800",
  draft: "bg-amber-100 text-amber-800",
  refuse: "bg-red-100 text-red-800",
};

const DECISION_BORDER: Record<string, string> = {
  act: "border-l-4 border-l-emerald-500",
  draft: "border-l-4 border-l-amber-500",
  refuse: "border-l-4 border-l-red-500",
};

function decisionLabel(result: SimResult): string {
  if (result.decision.decision === "act") return "✓ Act";
  if (result.decision.decision === "refuse") return "✗ Refuse";
  return `⏸ Draft · ${result.decision.tier}`;
}

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
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
        selected
          ? "bg-neutral-900 text-white border-neutral-900"
          : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-400",
      ].join(" ")}
    >
      {loading && selected ? "…" : scenario.label}
    </button>
  );
}

function ResultCard({ result }: { result: SimResult }) {
  const d = result.decision.decision;
  return (
    <div
      className={`rounded-lg border border-neutral-200 bg-white overflow-hidden ${
        DECISION_BORDER[d] ?? "border-l-4 border-l-neutral-400"
      }`}
    >
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
              DECISION_BADGE[d] ?? ""
            }`}
          >
            {decisionLabel(result)}
          </span>
          <span className="text-xs font-medium text-neutral-700 truncate">
            {result.scenario.label}
          </span>
        </div>
        <p className="text-xs text-neutral-700 leading-relaxed">
          {result.decision.reason}
        </p>
        <code className="inline-block bg-neutral-100 rounded px-2 py-0.5 font-mono text-[11px] text-neutral-600">
          {result.policyLine}
        </code>
        {result.decision.preview && (
          <p className="text-xs text-neutral-500 italic">
            {result.decision.preview}
          </p>
        )}
      </div>
    </div>
  );
}

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
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
            Policy Simulator
          </p>
        </div>
        <div className="p-8 flex flex-col items-center gap-2 text-center">
          <span className="text-2xl">🔬</span>
          <p className="text-sm font-medium text-neutral-500">No module loaded</p>
          <p className="text-xs text-neutral-400 max-w-xs">
            Scan a module above — the simulator will show how ARIA&apos;s policy
            engine responds to requests from it.
          </p>
        </div>
      </div>
    );
  }

  const scenarios = scenariosForScan(scannedModule);

  async function runScenario(scenario: SimScenario) {
    setSelectedId(scenario.id);
    setError("");
    if (results[scenario.id]) return;
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
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
          Policy Simulator
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">
          See how ARIA&apos;s policy engine responds to requests from this module
          — before trusting it.
        </p>
      </div>
      <div className="p-4 space-y-4">
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
        {error && <p className="text-xs text-red-600">{error}</p>}
        {activeResult && <ResultCard result={activeResult} />}
        {loadingId && !results[loadingId] && (
          <p className="text-xs text-neutral-400 animate-pulse">
            Simulating…
          </p>
        )}
      </div>
    </div>
  );
}
