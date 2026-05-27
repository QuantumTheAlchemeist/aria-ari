"use client";
import { useState } from "react";
import { AskPanel } from "@receipts/components/AskPanel";
import { SourcesPanel } from "@receipts/components/SourcesPanel";
import { ModuleScanner } from "@receipts/components/ModuleScanner";
import { TrustArchitect } from "@receipts/components/TrustArchitect";
import { PolicySimulator } from "@receipts/components/PolicySimulator";
import { DecisionCards } from "@receipts/components/DecisionCards";
import { Ledger } from "@receipts/components/Ledger";
import { type ModuleRiskScan } from "@receipts/lib/module-scan";

export default function AriaPage() {
  const [k, setK] = useState(0);
  const [scannedModule, setScannedModule] = useState<ModuleRiskScan | null>(null);
  const bump = () => setK((x) => x + 1);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">ARIA</h1>
          <span className="text-xs text-neutral-400 font-medium">ARI's Trust Layer</span>
          <a
            href="/"
            className="ml-auto text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            ← Dashboard
          </a>
        </div>
        <p className="text-sm text-neutral-500">
          Cited answers. Gated actions. Every interaction is a tamper-evident receipt.
        </p>
      </header>

      <AskPanel onReceipt={bump} />
      <SourcesPanel />
      <ModuleScanner onUseScan={setScannedModule} />
      <TrustArchitect scannedModule={scannedModule} onReceipt={bump} />
      <PolicySimulator scannedModule={scannedModule} />
      <DecisionCards onChange={bump} />
      <Ledger refreshKey={k} />
    </div>
  );
}
