# ARIA UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current linear single-column prototype UI with a production-grade two-column dashboard — sticky ledger, hero receipt chain, stepped Trust Architect wizard, and a consistent light/minimal-pro design language across all components.

**Architecture:** Pure UI change — only JSX and className strings are modified. No new npm packages. CSS custom properties added to `globals.css`. The page shell (`app/aria/page.tsx`) is restructured to a sticky topbar + two-column grid + full-width section below. All API interfaces and component props remain unchanged.

**Tech Stack:** Next.js 15, Tailwind CSS (raw utility classes), TypeScript

---

## File Map

| File | Change |
|---|---|
| `app/globals.css` | Add CSS custom properties |
| `app/layout.tsx` | `bg-neutral-50` on body (already there — confirm) |
| `app/aria/page.tsx` | Full rewrite: topbar + two-column grid + chain status state |
| `app/page.tsx` | Refined dashboard header |
| `modules-custom/receipts/components/ReceiptTimeline.tsx` | Full rewrite: hero chain nodes + connectors |
| `modules-custom/receipts/components/Ledger.tsx` | Card header, `formatRelative`, compact action buttons, detail list |
| `modules-custom/receipts/components/AskPanel.tsx` | Card header, `border-l-4` result, collapsible citations |
| `modules-custom/receipts/components/ModuleScanner.tsx` | Card header, `border-l-4` risk result |
| `modules-custom/receipts/components/TrustArchitect.tsx` | `ProgressStepper` inline component, callout, picker form, footer |
| `modules-custom/receipts/components/CleoDiagram.tsx` | Visual upgrade: colored layer borders, styled step diagram |
| `modules-custom/receipts/components/PolicySimulator.tsx` | Empty state, `border-l-4` result |
| `modules-custom/receipts/components/DecisionCards.tsx` | `ACTION TRIAGE` header, `border-l-4`, approve button |
| `modules-custom/receipts/components/DashboardWidget.tsx` | Colored dots, lift animation |

---

## Task 1: Design Foundation + Page Shell

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `app/aria/page.tsx`

- [ ] **Step 1: Update globals.css**

Replace entire file:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --c-surface:       #ffffff;
  --c-bg:            #f8f9fa;
  --c-border:        #e5e7eb;
  --c-border-strong: #d1d5db;
  --c-text:          #111827;
  --c-muted:         #6b7280;
  --c-success:       #059669;
  --c-warn:          #d97706;
  --c-danger:        #dc2626;
  --c-trust:         #7c3aed;
}
```

- [ ] **Step 2: Confirm layout.tsx body class**

`app/layout.tsx` should have `bg-neutral-50` on body. Verify it reads:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARIA — ARI's Trust Layer",
  description:
    "Cited answers. Gated actions. Tamper-evident receipts. ARIA makes ARI's AI safe to trust.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Rewrite app/aria/page.tsx**

```tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { AskPanel } from "@receipts/components/AskPanel";
import { ModuleScanner } from "@receipts/components/ModuleScanner";
import { TrustArchitect } from "@receipts/components/TrustArchitect";
import { PolicySimulator } from "@receipts/components/PolicySimulator";
import { DecisionCards } from "@receipts/components/DecisionCards";
import { Ledger } from "@receipts/components/Ledger";
import { type ModuleRiskScan } from "@receipts/lib/module-scan";
import { API_BASE } from "@receipts/lib/api-base";

interface VerifyResult {
  ok: boolean;
  brokenAtSeq?: number;
}

function ChainBadge({
  verify,
  count,
}: {
  verify: VerifyResult | null;
  count: number;
}) {
  if (!verify)
    return <span className="text-xs text-neutral-400">Loading…</span>;
  if (verify.ok) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
        Chain intact · {count} receipt{count !== 1 ? "s" : ""}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-red-700">
      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
      Broken at #{verify.brokenAtSeq}
    </span>
  );
}

export default function AriaPage() {
  const [k, setK] = useState(0);
  const [scannedModule, setScannedModule] = useState<ModuleRiskScan | null>(
    null
  );
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [receiptCount, setReceiptCount] = useState(0);
  const bump = () => setK((x) => x + 1);

  const fetchChainStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/list`);
      if (r.ok) {
        const d = await r.json();
        setVerify(d.verify);
        setReceiptCount(d.receipts?.length ?? 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchChainStatus();
  }, [k, fetchChainStatus]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Topbar */}
      <header className="sticky top-0 z-10 h-14 bg-white border-b border-neutral-200 flex items-center px-6">
        <div className="flex items-center gap-3">
          <span className="text-emerald-600 font-bold text-lg select-none">
            ◆
          </span>
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            ARIA
          </span>
          <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
            ARI&apos;s Trust Layer
          </span>
        </div>
        <div className="ml-auto flex items-center gap-6">
          <ChainBadge verify={verify} count={receiptCount} />
          <a
            href="/"
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            ← Dashboard
          </a>
        </div>
      </header>

      {/* Page body */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Left column */}
          <div className="space-y-6">
            <AskPanel onReceipt={bump} />
            <ModuleScanner onUseScan={setScannedModule} />
          </div>
          {/* Right column — sticky Ledger */}
          <div className="sticky top-[56px]">
            <Ledger refreshKey={k} />
          </div>
        </div>

        {/* Full-width section */}
        <div className="border-t border-neutral-100 mt-6 pt-6 space-y-6">
          <TrustArchitect scannedModule={scannedModule} onReceipt={bump} />
          <PolicySimulator scannedModule={scannedModule} />
          <DecisionCards onChange={bump} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
cd /Users/damilareo/Downloads/ARI && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx app/aria/page.tsx
git commit -m "feat(aria-ui): foundation — CSS vars, page shell, two-column layout, sticky topbar"
```

---

## Task 2: Hero Ledger Chain

**Files:**
- Modify: `modules-custom/receipts/components/ReceiptTimeline.tsx`
- Modify: `modules-custom/receipts/components/Ledger.tsx`

- [ ] **Step 1: Rewrite ReceiptTimeline.tsx**

```tsx
"use client";

interface LedgerReceipt {
  seq: number;
  kind: string;
  prompt: string;
  receipt_hash: string;
}

interface Props {
  receipts: LedgerReceipt[];
  brokenAtSeq: number;
}

const KIND_NODE: Record<string, string> = {
  answer: "bg-emerald-500 border-emerald-600",
  refusal: "bg-amber-500 border-amber-600",
  trust: "bg-violet-500 border-violet-600",
  action: "bg-blue-500 border-blue-600",
};

const KIND_CONNECTOR: Record<string, string> = {
  answer: "bg-emerald-200",
  refusal: "bg-amber-200",
  trust: "bg-violet-200",
  action: "bg-blue-200",
};

export function ReceiptTimeline({ receipts, brokenAtSeq }: Props) {
  const sorted = [...receipts].sort((a, b) => a.seq - b.seq);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-start min-w-max px-1 py-3 gap-0">
        {/* Genesis */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-neutral-300 mt-0.5" title="genesis" />
          <span className="text-[9px] text-neutral-400 font-medium">genesis</span>
        </div>

        {sorted.map((r) => {
          const broken = r.seq === brokenAtSeq;
          const afterBroken = brokenAtSeq > 0 && r.seq > brokenAtSeq;
          const nodeColor =
            broken || afterBroken
              ? "bg-red-500 border-red-600"
              : KIND_NODE[r.kind] ?? "bg-neutral-400 border-neutral-500";
          const connectorColor =
            broken || afterBroken
              ? "bg-red-200"
              : KIND_CONNECTOR[r.kind] ?? "bg-neutral-200";

          return (
            <div key={r.seq} className="flex items-start">
              {/* Connector */}
              <div className={`w-6 h-px mt-[5px] ${connectorColor}`} />
              {/* Node + label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full border-2 cursor-default ${nodeColor} ${broken ? "animate-pulse" : ""}`}
                  title={`#${r.seq} ${r.kind} · ${r.prompt}`}
                />
                <span
                  className={`text-[9px] font-medium ${broken || afterBroken ? "text-red-500" : "text-neutral-400"}`}
                >
                  #{r.seq}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite Ledger.tsx**

```tsx
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
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/damilareo/Downloads/ARI && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Run existing tests**

```bash
cd /Users/damilareo/Downloads/ARI && npx vitest run
```

Expected: 11/11 pass

- [ ] **Step 5: Commit**

```bash
git add modules-custom/receipts/components/ReceiptTimeline.tsx modules-custom/receipts/components/Ledger.tsx
git commit -m "feat(aria-ui): hero receipt chain + refined ledger card with timestamps"
```

---

## Task 3: Left Column — Ask Panel + Module Scanner

**Files:**
- Modify: `modules-custom/receipts/components/AskPanel.tsx`
- Modify: `modules-custom/receipts/components/ModuleScanner.tsx`

- [ ] **Step 1: Rewrite AskPanel.tsx**

```tsx
"use client";
import { useState } from "react";
import { API_BASE } from "../lib/api-base";

interface Citation {
  id: string;
  title: string;
  snippet: string;
}

interface AskResult {
  kind: "answer" | "refusal";
  text: string;
  citations: Citation[];
}

interface AskResponse {
  result: AskResult;
}

export function AskPanel({ onReceipt }: { onReceipt: () => void }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citationsOpen, setCitationsOpen] = useState(false);

  async function ask() {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setCitationsOpen(false);
    try {
      const r = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setError((e as { error?: string }).error ?? "Request failed");
        return;
      }
      setRes(await r.json());
      onReceipt();
    } catch {
      setError("Network error — is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  const isRefusal = res?.result.kind === "refusal";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
          Ask ARIA
        </p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 transition-colors"
            placeholder="Ask about your notes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            disabled={loading}
          />
          <button
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white font-medium disabled:opacity-40 hover:bg-emerald-500 transition-colors"
            onClick={ask}
            disabled={loading || !q.trim()}
          >
            {loading ? "…" : "Ask →"}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">
            {error}
          </p>
        )}

        {res && (
          <div
            className={`rounded-lg border border-neutral-200 bg-white overflow-hidden ${
              isRefusal
                ? "border-l-4 border-l-amber-500"
                : "border-l-4 border-l-emerald-500"
            }`}
          >
            <div className="p-4 space-y-2">
              <span
                className={`text-xs font-bold uppercase tracking-widest ${
                  isRefusal ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {isRefusal ? "⚠ Refusal" : "✓ Cited Answer"}
              </span>
              <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                {res.result.text}
              </p>
              {res.result.citations.length > 0 && (
                <div>
                  <button
                    className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-1"
                    onClick={() => setCitationsOpen((x) => !x)}
                  >
                    {citationsOpen ? "▲" : "▼"} {res.result.citations.length}{" "}
                    source{res.result.citations.length !== 1 ? "s" : ""}
                  </button>
                  {citationsOpen && (
                    <ol className="mt-2 space-y-1 pl-4 list-decimal">
                      {res.result.citations.map((c, i) => (
                        <li key={i} className="text-xs text-neutral-500">
                          <span className="font-medium text-neutral-700">
                            {c.title}
                          </span>
                          : {c.snippet}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite ModuleScanner.tsx**

```tsx
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
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/damilareo/Downloads/ARI && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add modules-custom/receipts/components/AskPanel.tsx modules-custom/receipts/components/ModuleScanner.tsx
git commit -m "feat(aria-ui): ask panel + module scanner — card headers, border-l-4 results, collapsible citations"
```

---

## Task 4: Trust Architect + CleoDiagram

**Files:**
- Modify: `modules-custom/receipts/components/TrustArchitect.tsx`
- Modify: `modules-custom/receipts/components/CleoDiagram.tsx`

- [ ] **Step 1: Rewrite TrustArchitect.tsx**

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/api-base";
import {
  CLEO_STAGES,
  answerAsk,
  buildFinalPolicy,
  diagramFor,
  type CleoStageId,
  type Workflow,
} from "../lib/cleo";
import { type ModuleRiskScan } from "../lib/module-scan";
import { CleoDiagram } from "./CleoDiagram";

const READS = [
  "notes",
  "tasks",
  "documents",
  "contacts",
  "calendar",
  "finance records",
];
const ACTIONS = [
  "answer questions",
  "create task",
  "archive note",
  "email teammate",
  "export document",
  "delete notes",
  "initiate payment",
];
const BOTTLENECKS = [
  "hallucinated answers",
  "unsafe writes",
  "stale project memory",
  "unclear approvals",
  "editable audit history",
];
const WORKFLOWS: Workflow[] = [
  "knowledge",
  "tasks",
  "email",
  "documents",
  "finance",
  "custom",
];

function stageCopy(stage: CleoStageId): string {
  if (stage === "picker")
    return "Start like Cleo: choose the module's job, the records it can read, and the risky moments it must handle.";
  if (stage === "overview")
    return "Cleo proposes the stack first, so the user sees the whole operating model before the details.";
  if (stage === "data")
    return "The data layer is the RAG boundary: answer from retrieved ARI sources, or refuse.";
  if (stage === "actions")
    return "The action layer decides whether a proposed write can act, must draft, or must be refused.";
  if (stage === "approval")
    return "The approval layer makes the named human explicit before anything consequential happens.";
  if (stage === "ledger")
    return "The ledger layer seals the decision trail so a later edit breaks verification.";
  if (stage === "benefits")
    return "This is the judge-facing why: ARI modules become safe to trust, not just fast to create.";
  return "Seal the policy as a trust receipt. Any later policy change should create a new receipt.";
}

function ProgressStepper({
  stages,
  currentId,
  onNavigate,
}: {
  stages: typeof CLEO_STAGES;
  currentId: CleoStageId;
  onNavigate: (id: CleoStageId) => void;
}) {
  const currentIdx = stages.findIndex((s) => s.id === currentId);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-start min-w-max pb-1 gap-0">
        {stages.map((s, i) => {
          const isCompleted = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <div key={s.id} className="flex items-start">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => isCompleted && onNavigate(s.id)}
                  disabled={!isCompleted}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors
                    ${
                      isCompleted
                        ? "bg-emerald-600 text-white cursor-pointer hover:bg-emerald-500"
                        : isActive
                        ? "bg-neutral-900 text-white cursor-default"
                        : "bg-white border-2 border-neutral-200 text-neutral-400 cursor-default"
                    }`}
                  title={s.title}
                >
                  {isCompleted ? "✓" : i + 1}
                </button>
                <span
                  className={`text-[9px] text-center w-12 leading-tight ${
                    isActive
                      ? "text-neutral-900 font-medium"
                      : "text-neutral-400"
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div
                  className={`w-8 h-px mt-3 ${
                    i < currentIdx ? "bg-emerald-200" : "bg-neutral-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrustArchitect({
  onReceipt,
  scannedModule,
}: {
  onReceipt: () => void;
  scannedModule?: ModuleRiskScan | null;
}) {
  const [moduleName, setModuleName] = useState("Project Memory Copilot");
  const [workflow, setWorkflow] = useState<Workflow>("knowledge");
  const [reads, setReads] = useState<string[]>(["notes", "documents"]);
  const [actions, setActions] = useState<string[]>([
    "answer questions",
    "create task",
    "archive note",
    "delete notes",
  ]);
  const [bottlenecks, setBottlenecks] = useState<string[]>([
    "hallucinated answers",
    "unsafe writes",
    "editable audit history",
  ]);
  const [stageId, setStageId] = useState<CleoStageId>("picker");
  const [askAnswer, setAskAnswer] = useState("");
  const [policy, setPolicy] = useState("");
  const [sealing, setSealing] = useState(false);
  const [sealError, setSealError] = useState("");

  useEffect(() => {
    if (!scannedModule) return;
    setModuleName(scannedModule.moduleName);
    if (scannedModule.suggestedReads.length > 0)
      setReads(scannedModule.suggestedReads);
    if (scannedModule.suggestedActions.length > 0)
      setActions(scannedModule.suggestedActions);
    if (scannedModule.suggestedBottlenecks.length > 0)
      setBottlenecks(scannedModule.suggestedBottlenecks);
    setStageId("overview");
    setAskAnswer("");
  }, [scannedModule]);

  const input = useMemo(
    () => ({ moduleName, workflow, reads, actions, bottlenecks, owner: "ARI user" }),
    [moduleName, workflow, reads, actions, bottlenecks]
  );
  const stage = CLEO_STAGES.find((s) => s.id === stageId) ?? CLEO_STAGES[0];
  const diagram = stageId === "picker" ? null : diagramFor(stageId, input);
  const currentIdx = CLEO_STAGES.findIndex((s) => s.id === stageId);

  function toggle(
    v: string,
    list: string[],
    setList: (x: string[]) => void
  ) {
    setList(
      list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
    );
  }

  function next() {
    setAskAnswer("");
    if (stage.next) setStageId(stage.next);
  }

  function back() {
    const idx = CLEO_STAGES.findIndex((s) => s.id === stageId);
    if (idx > 0) {
      setStageId(CLEO_STAGES[idx - 1].id);
      setAskAnswer("");
    }
  }

  async function seal() {
    setSealing(true);
    setSealError("");
    try {
      const r = await fetch(`${API_BASE}/trust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!r.ok) {
        setSealError("Server error — policy was NOT sealed into the ledger.");
        return;
      }
      const data = await r.json();
      setPolicy(data.policy ?? buildFinalPolicy(input));
      onReceipt();
    } catch {
      setSealError("Network error — policy was NOT sealed into the ledger.");
    } finally {
      setSealing(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
          Trust Architect
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">
          Design the trust stack for any ARI module — then seal the policy as a
          verifiable receipt.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress stepper */}
        <ProgressStepper
          stages={CLEO_STAGES}
          currentId={stageId}
          onNavigate={(id) => {
            setStageId(id);
            setAskAnswer("");
          }}
        />

        {/* Stage description callout */}
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
          <span className="font-medium">{stage.title}: </span>
          {stageCopy(stageId)}
        </div>

        {/* Picker stage */}
        {stageId === "picker" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-widest text-neutral-400 block mb-1.5">
                  Module name
                </span>
                <input
                  className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 transition-colors"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-widest text-neutral-400 block mb-1.5">
                  Workflow
                </span>
                <select
                  className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                  value={workflow}
                  onChange={(e) => setWorkflow(e.target.value as Workflow)}
                >
                  {WORKFLOWS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-lg bg-neutral-50 p-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                Can read
              </p>
              <div className="flex flex-wrap gap-2">
                {READS.map((x) => (
                  <button
                    key={x}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      reads.includes(x)
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "border-neutral-200 hover:bg-neutral-100"
                    }`}
                    onClick={() => toggle(x, reads, setReads)}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-neutral-50 p-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                Can propose actions
              </p>
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map((x) => (
                  <button
                    key={x}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      actions.includes(x)
                        ? "bg-blue-50 border-blue-300 text-blue-800"
                        : "border-neutral-200 hover:bg-neutral-100"
                    }`}
                    onClick={() => toggle(x, actions, setActions)}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-neutral-50 p-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                Known risks
              </p>
              <div className="flex flex-wrap gap-2">
                {BOTTLENECKS.map((x) => (
                  <button
                    key={x}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      bottlenecks.includes(x)
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "border-neutral-200 hover:bg-neutral-100"
                    }`}
                    onClick={() => toggle(x, bottlenecks, setBottlenecks)}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Diagram stages */}
        {stageId !== "picker" && <CleoDiagram diagram={diagram} />}

        {/* Q&A chips */}
        {stage.asks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stage.asks.map((q) => (
              <button
                key={q}
                className="rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 px-3 py-2 text-xs shadow-sm transition-colors"
                onClick={() => setAskAnswer(answerAsk(q))}
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {askAnswer && (
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
            {askAnswer}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div>
            {currentIdx > 0 && (
              <button
                className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                onClick={back}
              >
                ← Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400">
              Step {currentIdx + 1} of {CLEO_STAGES.length}
            </span>
            {stage.next && (
              <button
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white font-medium hover:bg-neutral-700 transition-colors"
                onClick={next}
              >
                Continue:{" "}
                {CLEO_STAGES.find((s) => s.id === stage.next)?.title} →
              </button>
            )}
            {stageId === "final" && (
              <button
                className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm text-white font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
                onClick={seal}
                disabled={sealing}
              >
                {sealing ? "Sealing…" : "Seal trust receipt"}
              </button>
            )}
          </div>
        </div>

        {sealError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
            {sealError}
          </p>
        )}

        {stageId === "final" && policy && (
          <pre className="whitespace-pre-wrap rounded-lg bg-neutral-950 text-emerald-400 p-4 text-xs font-mono">
            {policy}
          </pre>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite CleoDiagram.tsx**

```tsx
"use client";

type StackLayer = { name: string; role: string; primitive: string };
type ImpactItem = { label: string; before: string; after: string };
type Diagram =
  | { kind: "stack"; title: string; layers: StackLayer[] }
  | {
      kind: "step";
      title: string;
      input: string;
      node: { name: string; primitive: string };
      output: string;
      note: string;
    }
  | { kind: "impact"; title: string; items: ImpactItem[] }
  | { kind: "policy"; title: string; status: string; receiptKind: string }
  | null;

const LAYER_COLORS = [
  "border-l-emerald-500",
  "border-l-blue-500",
  "border-l-amber-500",
  "border-l-violet-500",
  "border-l-neutral-400",
];

export function CleoDiagram({ diagram }: { diagram: Diagram }) {
  if (!diagram) return null;

  if (diagram.kind === "stack")
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <div className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
          {diagram.title}
        </div>
        <div className="grid gap-2">
          {diagram.layers.map((l, i) => (
            <div
              key={l.name}
              className={`grid grid-cols-[140px_1fr] gap-3 rounded-lg border-l-4 border border-neutral-200 bg-white p-2.5 text-xs ${
                LAYER_COLORS[i % LAYER_COLORS.length]
              }`}
            >
              <span className="font-semibold text-neutral-800">{l.name}</span>
              <span className="text-neutral-600">{l.role}</span>
            </div>
          ))}
        </div>
      </div>
    );

  if (diagram.kind === "impact")
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <div className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
          {diagram.title}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {diagram.items.map((x) => (
            <div
              key={x.label}
              className="rounded-lg border border-neutral-200 bg-white p-2.5 text-xs"
            >
              <span className="font-semibold text-neutral-800">{x.label}</span>
              <div className="mt-1 flex items-center gap-1.5 text-neutral-500">
                <span>{x.before}</span>
                <span className="text-neutral-400">→</span>
                <span className="text-emerald-700 font-medium">{x.after}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (diagram.kind === "policy")
    return (
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-950">
        <div className="font-semibold text-sm">{diagram.title}</div>
        <div className="mt-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs text-violet-700">
          Ready to seal as a{" "}
          <span className="font-medium">{diagram.receiptKind}</span> receipt.
        </div>
      </div>
    );

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs">
      <div className="font-semibold text-neutral-800 mb-2">{diagram.title}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-neutral-700">
          {diagram.input}
        </span>
        <span className="text-neutral-400 font-bold">→</span>
        <span className="rounded-lg border border-neutral-900 bg-neutral-900 px-2.5 py-1.5 text-white font-medium">
          {diagram.node.name}
        </span>
        <span className="text-neutral-400 font-bold">→</span>
        <span className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-neutral-700">
          {diagram.output}
        </span>
      </div>
      {diagram.note && (
        <div className="mt-2 text-neutral-500 text-xs">{diagram.note}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/damilareo/Downloads/ARI && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add modules-custom/receipts/components/TrustArchitect.tsx modules-custom/receipts/components/CleoDiagram.tsx
git commit -m "feat(aria-ui): trust architect progress stepper + stage callouts + CleoDiagram upgrade"
```

---

## Task 5: Policy Simulator + Decision Cards

**Files:**
- Modify: `modules-custom/receipts/components/PolicySimulator.tsx`
- Modify: `modules-custom/receipts/components/DecisionCards.tsx`

- [ ] **Step 1: Rewrite PolicySimulator.tsx**

```tsx
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
```

- [ ] **Step 2: Rewrite DecisionCards.tsx**

```tsx
"use client";
import { useState } from "react";
import { API_BASE } from "../lib/api-base";

interface DemoAction {
  label: string;
  body: {
    toolName: string;
    toolInput: Record<string, unknown>;
    affectedCount?: number;
    irreversible?: boolean;
  };
}

const DEMOS: DemoAction[] = [
  {
    label: "Create a task",
    body: {
      toolName: "create_task",
      toolInput: { title: "Review billing migration" },
    },
  },
  {
    label: "Email 15 teammates",
    body: {
      toolName: "draft_email",
      toolInput: { recipientCount: 15 },
      affectedCount: 15,
    },
  },
  {
    label: "Delete 23 notes",
    body: {
      toolName: "delete_notes",
      toolInput: { count: 23 },
      affectedCount: 23,
      irreversible: true,
    },
  },
  {
    label: "Delete 60 notes",
    body: {
      toolName: "delete_notes",
      toolInput: { count: 60 },
      affectedCount: 60,
      irreversible: true,
    },
  },
];

const DECISION_BORDER: Record<string, string> = {
  act: "border-l-4 border-l-emerald-500",
  draft: "border-l-4 border-l-amber-500",
  refuse: "border-l-4 border-l-red-500",
};

const DECISION_BADGE: Record<string, string> = {
  act: "bg-emerald-100 text-emerald-800",
  draft: "bg-amber-100 text-amber-800",
  refuse: "bg-red-100 text-red-800",
};

interface DecisionState {
  decision: "act" | "draft" | "refuse";
  tier: string;
  reason: string;
  preview: string;
  confirmationToken?: string;
  _body: DemoAction["body"];
}

export function DecisionCards({ onChange }: { onChange: () => void }) {
  const [d, setD] = useState<DecisionState | null>(null);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState("");

  async function propose(body: DemoAction["body"]) {
    const r = await fetch(`${API_BASE}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await r.json();
    setD({ ...json, _body: body });
  }

  async function approve() {
    if (!d?.confirmationToken) return;
    setApproving(true);
    setApproveError("");
    try {
      const r = await fetch(`${API_BASE}/action`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: d._body.toolName,
          toolInput: d._body.toolInput,
          token: d.confirmationToken,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: "Approval failed" }));
        setApproveError(err.error ?? "Approval failed");
        return;
      }
      setD(null);
      onChange();
    } catch {
      setApproveError("Network error — approval not sent");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
          Action Triage
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">
          Propose an action — ARIA decides whether to act, draft, or refuse.
        </p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {DEMOS.map((x) => (
            <button
              key={x.label}
              className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
              onClick={() => propose(x.body)}
            >
              {x.label}
            </button>
          ))}
        </div>

        {d && (
          <div
            className={`rounded-lg border border-neutral-200 bg-white overflow-hidden ${
              DECISION_BORDER[d.decision] ?? "border-l-4 border-l-neutral-400"
            }`}
          >
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    DECISION_BADGE[d.decision] ?? ""
                  }`}
                >
                  {d.decision}
                </span>
                <span className="text-xs text-neutral-400">
                  tier: {d.tier}
                </span>
              </div>
              <p className="text-sm font-medium text-neutral-900">
                {d.preview}
              </p>
              <p className="text-xs text-neutral-500">{d.reason}</p>
              {d.decision === "draft" && d.confirmationToken && (
                <>
                  <button
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs text-white font-medium disabled:opacity-50 hover:bg-amber-500 transition-colors"
                    onClick={approve}
                    disabled={approving}
                  >
                    {approving ? "Sealing…" : "🔒 Approve & seal receipt"}
                  </button>
                  {approveError && (
                    <p className="text-xs text-red-700">{approveError}</p>
                  )}
                </>
              )}
              {d.decision === "act" && (
                <p className="text-xs text-neutral-500 italic">
                  ⚡ Executes automatically — no approval needed.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/damilareo/Downloads/ARI && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add modules-custom/receipts/components/PolicySimulator.tsx modules-custom/receipts/components/DecisionCards.tsx
git commit -m "feat(aria-ui): policy simulator empty state + border-l-4 results; decision cards action triage"
```

---

## Task 6: Dashboard Widget

**Files:**
- Modify: `modules-custom/receipts/components/DashboardWidget.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Rewrite DashboardWidget.tsx**

```tsx
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
```

- [ ] **Step 2: Update app/page.tsx**

```tsx
import { DashboardWidget } from "@receipts/components/DashboardWidget";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            ARI Dashboard
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Installed modules</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardWidget />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/damilareo/Downloads/ARI && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add modules-custom/receipts/components/DashboardWidget.tsx app/page.tsx
git commit -m "feat(aria-ui): dashboard widget colored dots + lift animation"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Full TypeScript check**

```bash
cd /Users/damilareo/Downloads/ARI && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 2: Run all tests**

```bash
cd /Users/damilareo/Downloads/ARI && npx vitest run
```

Expected: 11/11 pass

- [ ] **Step 3: Start dev server and smoke-test**

```bash
cd /Users/damilareo/Downloads/ARI && npm run dev
```

Open http://localhost:3000 and verify:
- Dashboard page loads with `bg-neutral-50` background
- ARIA widget card has lift animation on hover
- Navigate to `/aria`
- Topbar is sticky with `◆ ARIA` logo and chain badge
- Two-column layout on wide screen (left: Ask + Scanner, right: Ledger)
- Seed demo → chain nodes appear in Ledger hero
- Tamper → broken node pulses red, chain badge in topbar turns red
- Ask a question → answer card has green left border
- Load a preset in Scanner → risk card has colored left border + Send to Trust Architect works
- Trust Architect shows 8-step stepper, Back/Continue navigation works
- Seal → dark terminal output block appears
- Policy Simulator shows empty state icon before scan, scenario chips after

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(aria-ui): production UI redesign complete — two-column dashboard, hero chain, stepped wizard"
```
