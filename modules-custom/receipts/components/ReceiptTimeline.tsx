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
