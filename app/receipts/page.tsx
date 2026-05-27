"use client";
import { useState } from "react";
import { AskPanel } from "@receipts/components/AskPanel";
import { TrustArchitect } from "@receipts/components/TrustArchitect";
import { DecisionCards } from "@receipts/components/DecisionCards";
import { Ledger } from "@receipts/components/Ledger";

export default function ReceiptsPage() {
  const [k, setK] = useState(0);
  const bump = () => setK((x) => x + 1);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Receipts</h1>
          <a
            href="/"
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            ← Dashboard
          </a>
        </div>
        <p className="text-sm text-neutral-500">
          Every answer cites its sources. Every action needs consent. Every
          interaction is a tamper-evident receipt.
        </p>
      </header>

      <AskPanel onReceipt={bump} />
      <TrustArchitect onReceipt={bump} />
      <DecisionCards onChange={bump} />
      <Ledger refreshKey={k} />
    </div>
  );
}
