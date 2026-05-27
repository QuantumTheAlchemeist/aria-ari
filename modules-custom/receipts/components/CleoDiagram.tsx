"use client";

export function CleoDiagram({ diagram }: { diagram: any }) {
  if (!diagram) return null;

  if (diagram.kind === "stack") return (
    <div className="rounded-md border bg-neutral-50 p-3">
      <div className="mb-2 text-xs font-semibold uppercase text-neutral-500">{diagram.title}</div>
      <div className="grid gap-2">
        {diagram.layers.map((l: any) => (
          <div key={l.name} className="grid grid-cols-[120px_1fr] gap-2 rounded border bg-white p-2 text-xs">
            <span className="font-semibold">{l.name}</span>
            <span>{l.role}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (diagram.kind === "impact") return (
    <div className="rounded-md border bg-neutral-50 p-3">
      <div className="mb-2 text-xs font-semibold uppercase text-neutral-500">{diagram.title}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {diagram.items.map((x: any) => (
          <div key={x.label} className="rounded border bg-white p-2 text-xs">
            <b>{x.label}</b>: {x.before} → {x.after}
          </div>
        ))}
      </div>
    </div>
  );

  if (diagram.kind === "policy") return (
    <div className="rounded-md border bg-purple-50 p-3 text-xs text-purple-950">
      <div className="font-semibold">{diagram.title}</div>
      <div className="mt-2 rounded border border-purple-200 bg-white px-3 py-2">
        Ready to seal as a {diagram.receiptKind} receipt.
      </div>
    </div>
  );

  return (
    <div className="rounded-md border bg-neutral-50 p-3 text-xs">
      <div className="font-semibold">{diagram.title}</div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span className="rounded border bg-white px-2 py-1">{diagram.input}</span>
        <span>→</span>
        <span className="rounded border bg-white px-2 py-1">{diagram.node?.name ?? diagram.status}</span>
        <span>→</span>
        <span className="rounded border bg-white px-2 py-1">{diagram.output ?? diagram.receiptKind}</span>
      </div>
      {diagram.note && <div className="mt-2 text-neutral-500">{diagram.note}</div>}
    </div>
  );
}
