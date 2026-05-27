"use client";
import { useState } from "react";
import { API_BASE } from "../lib/api-base";
import { PRESET_MODULES, type ModuleRiskScan } from "../lib/module-scan";

const RISK_STYLE: Record<string, string> = {
  low: "bg-emerald-50 border-emerald-300 text-emerald-800",
  medium: "bg-amber-50 border-amber-300 text-amber-800",
  high: "bg-red-50 border-red-300 text-red-800",
};

const RISK_BADGE: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const PERM_ICON: Record<string, string> = {
  database: "🗄",
  api: "🔌",
  dashboard: "📊",
};

export function ModuleScanner({ onUseScan }: { onUseScan: (scan: ModuleRiskScan) => void }) {
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

  function loadPreset(manifest: unknown) {
    const text = JSON.stringify(manifest, null, 2);
    setJson(text);
    runScan(text);
  }

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div>
          <h3 className="font-semibold text-sm">ARI Module Risk Scanner</h3>
          <p className="text-xs text-neutral-500">
            Paste any ARI module.json — ARIA detects its risk profile and seeds the Trust Architect.
          </p>
        </div>
        <button
          className="ml-auto text-xs text-neutral-400 hover:text-neutral-600"
          onClick={() => setExpanded((x) => !x)}
        >
          {expanded ? "Collapse ↑" : "Expand ↓"}
        </button>
      </div>

      {expanded && (
        <>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-neutral-400 self-center">Presets:</span>
            {PRESET_MODULES.map((p) => (
              <button
                key={p.label}
                className="rounded-full border px-3 py-1 text-xs hover:bg-neutral-50"
                onClick={() => loadPreset(p.manifest)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <textarea
            className="w-full rounded-md border bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-300"
            rows={6}
            placeholder={'{\n  "id": "my-module",\n  "name": "My Module",\n  "permissions": { "database": true, "api": true }\n}'}
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
            onClick={() => runScan(json)}
            disabled={scanning || !json.trim()}
          >
            {scanning ? "Scanning…" : "Scan module"}
          </button>
        </>
      )}

      {scan && (
        <div className={`rounded-md border p-3 space-y-2 ${RISK_STYLE[scan.riskLevel]}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{scan.moduleName}</span>
            <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${RISK_BADGE[scan.riskLevel]}`}>
              {scan.riskLevel} risk
            </span>
            {scan.permissions.map((p) => (
              <span key={p} className="text-xs opacity-70">
                {PERM_ICON[p] ?? "⚙"} {p}
              </span>
            ))}
          </div>

          <ul className="space-y-0.5">
            {scan.risks.map((r, i) => (
              <li key={i} className="text-xs flex gap-1.5">
                <span className="opacity-50">·</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>

          {(scan.suggestedReads.length > 0 || scan.suggestedActions.length > 0) && (
            <div className="flex flex-wrap gap-4 text-xs pt-1 border-t border-current/10">
              {scan.suggestedReads.length > 0 && (
                <div>
                  <span className="font-medium opacity-70">Reads: </span>
                  {scan.suggestedReads.join(", ")}
                </div>
              )}
              {scan.suggestedActions.length > 0 && (
                <div>
                  <span className="font-medium opacity-70">Can: </span>
                  {scan.suggestedActions.join(", ")}
                </div>
              )}
            </div>
          )}

          <button
            className="mt-1 rounded-md bg-white/80 border border-current/20 px-3 py-1.5 text-xs font-medium hover:bg-white transition-colors"
            onClick={() => { onUseScan(scan); if (!expanded) setExpanded(false); }}
          >
            Send to Trust Architect →
          </button>
        </div>
      )}
    </div>
  );
}
