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
