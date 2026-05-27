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

const KIND_COLORS: Record<string, string> = {
  answer: "bg-blue-100 text-blue-700 border-blue-200",
  refusal: "bg-red-100 text-red-700 border-red-200",
  trust: "bg-purple-100 text-purple-700 border-purple-200",
  action: "bg-amber-100 text-amber-700 border-amber-200",
};

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

export function ReceiptTimeline({ receipts, brokenAtSeq }: Props) {
  const sorted = [...receipts].sort((a, b) => a.seq - b.seq);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max px-2 py-2">
        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500 whitespace-nowrap">
          genesis
        </span>

        {sorted.map((r) => {
          const broken = r.seq === brokenAtSeq;
          const color = broken
            ? "bg-red-100 text-red-700 border-red-300"
            : (KIND_COLORS[r.kind] ?? "bg-neutral-100 text-neutral-600 border-neutral-200");
          return (
            <div key={r.seq} className="flex items-center gap-1">
              <span className="text-neutral-300 text-xs select-none">→</span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap cursor-default ${color}`}
                title={r.prompt}
              >
                <span className="font-semibold mr-1">#{r.seq}</span>
                <span className="mr-1">{r.kind}</span>
                {r.prompt.trim().length > 0 && (
                  <span className="opacity-60">· {truncate(r.prompt.trim(), 20)}</span>
                )}
                {broken && <span className="ml-1 font-bold">✗</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
