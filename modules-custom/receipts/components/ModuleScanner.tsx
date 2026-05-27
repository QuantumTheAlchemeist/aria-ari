"use client";
import { useState } from "react";
import { API_BASE } from "../lib/api-base";
import { PRESET_MODULES, type ModuleRiskScan } from "../lib/module-scan";

const RISK_BORDER: Record<string, string> = {
  low: "border-l-4 border-l-emerald-500",
  medium: "border-l-4 border-l-amber-500",
  high: "border-l-4 border-l-red-500",
  critical: "border-l-4 border-l-red-600",
};

const RISK_BADGE: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
  critical: "bg-red-200 text-red-900",
};

const PERM_ICON: Record<string, string> = {
  database: "🗄",
  api: "🔌",
  dashboard: "📊",
};

export function ModuleScanner({
  onUseScan,
}: {
  onUseScan: (scan: ModuleRiskScan) => void;
}) {
  const [json, setJson] = useState("");
  const [scan, setScan] = useState<ModuleRiskScan | null>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [expanded, setExpanded] = useState(true);

  async function runScan(manifestText: string) {
    setError("");
    setScanning(true);
    try {
      let manifest: unknown;
      try {
        manifest = JSON.parse(manifestText);
      } catch {
        setError("Invalid JSON — paste a valid module.json");
        return;
      }
      const r = await fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifest }),
      });
      if (!r.ok) {
        setError("Scan failed");
        return;
      }
      setScan(await r.json());
    } catch {
      setError("Network error");
    } finally {
      setScanning(false);
    }
  }

  async function loadPreset(manifest: unknown) {
    const text = JSON.stringify(manifest, null, 2);
    setJson(text);
    await runScan(text);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
            Module Risk Scanner
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Paste a module.json — ARIA detects its risk profile
          </p>
        </div>
        <button
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors shrink-0 ml-4"
          onClick={() => setExpanded((x) => !x)}
        >
          {expanded ? "Collapse ↑" : "Expand ↓"}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {expanded && (
          <>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-neutral-400 self-center">
                Presets:
              </span>
              {PRESET_MODULES.map((p) => (
                <button
                  key={p.label}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
                  onClick={() => loadPreset(p.manifest)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <textarea
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 resize-none"
              rows={6}
              placeholder={
                '{\n  "id": "my-module",\n  "name": "My Module",\n  "permissions": { "database": true, "api": true }\n}'
              }
              value={json}
              onChange={(e) => setJson(e.target.value)}
            />

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white font-medium hover:bg-neutral-700 disabled:opacity-50 transition-colors"
              onClick={() => runScan(json)}
              disabled={scanning || !json.trim()}
            >
              {scanning ? "Scanning…" : "Scan module →"}
            </button>
          </>
        )}

        {scan && (
          <div
            className={`rounded-lg border border-neutral-200 bg-white overflow-hidden ${
              RISK_BORDER[scan.riskLevel] ?? "border-l-4 border-l-neutral-400"
            }`}
          >
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-neutral-900">
                  {scan.moduleName}
                </span>
                <span
                  className={`rounded-full text-[10px] font-bold uppercase px-2 py-0.5 ${
                    RISK_BADGE[scan.riskLevel]
                  }`}
                >
                  {scan.riskLevel} risk
                </span>
                {"score" in scan && (
                  <span className="text-xs text-neutral-400 font-mono">
                    score: {(scan as { score: number }).score}
                  </span>
                )}
                {scan.permissions.map((p) => (
                  <span key={p} className="text-xs text-neutral-500">
                    {PERM_ICON[p] ?? "⚙"} {p}
                  </span>
                ))}
              </div>

              <ul className="space-y-1">
                {scan.risks.map((r, i) => (
                  <li key={i} className="text-xs text-neutral-700 flex gap-1.5">
                    <span className="text-neutral-400">·</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              {(scan.suggestedReads.length > 0 ||
                scan.suggestedActions.length > 0) && (
                <div className="flex flex-wrap gap-4 text-xs pt-1 border-t border-neutral-100">
                  {scan.suggestedReads.length > 0 && (
                    <div>
                      <span className="font-medium text-neutral-500">
                        Reads:{" "}
                      </span>
                      {scan.suggestedReads.join(", ")}
                    </div>
                  )}
                  {scan.suggestedActions.length > 0 && (
                    <div>
                      <span className="font-medium text-neutral-500">
                        Can:{" "}
                      </span>
                      {scan.suggestedActions.join(", ")}
                    </div>
                  )}
                </div>
              )}

              <button
                className="rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 px-3 py-1.5 text-xs font-medium shadow-sm transition-colors"
                onClick={() => {
                  onUseScan(scan);
                  if (!expanded) setExpanded(false);
                }}
              >
                Send to Trust Architect →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
