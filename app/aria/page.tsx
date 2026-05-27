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
