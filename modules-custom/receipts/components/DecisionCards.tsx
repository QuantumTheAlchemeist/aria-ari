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
    body: { toolName: "create_task", toolInput: { title: "Review billing migration" } },
  },
  {
    label: "Email 15 teammates",
    body: { toolName: "draft_email", toolInput: { recipientCount: 15 }, affectedCount: 15 },
  },
  {
    label: "Delete 23 notes",
    body: { toolName: "delete_notes", toolInput: { count: 23 }, affectedCount: 23, irreversible: true },
  },
  {
    label: "Delete 60 notes",
    body: { toolName: "delete_notes", toolInput: { count: 60 }, affectedCount: 60, irreversible: true },
  },
];

// Hard-coded so Tailwind never purges these classes at build time
const BOX: Record<string, string> = {
  act: "bg-emerald-50 border-emerald-300 text-emerald-900",
  draft: "bg-amber-50 border-amber-300 text-amber-900",
  refuse: "bg-red-50 border-red-300 text-red-900",
};

const BADGE: Record<string, string> = {
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
    <div className="rounded-xl border bg-white p-4 space-y-3 shadow-sm">
      <h3 className="font-semibold text-sm">Ask the assistant to act</h3>
      <div className="flex flex-wrap gap-2">
        {DEMOS.map((x) => (
          <button
            key={x.label}
            className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-neutral-50 transition-colors"
            onClick={() => propose(x.body)}
          >
            {x.label}
          </button>
        ))}
      </div>

      {d && (
        <div
          className={`rounded-md border p-3 text-sm space-y-1 ${
            BOX[d.decision] ?? "bg-neutral-50 border"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wide rounded px-2 py-0.5 ${
                BADGE[d.decision] ?? ""
              }`}
            >
              {d.decision}
            </span>
            <span className="text-xs opacity-70">tier: {d.tier}</span>
          </div>
          <p className="font-medium">{d.preview}</p>
          <p className="opacity-80 text-xs">{d.reason}</p>
          {d.decision === "draft" && d.confirmationToken && (
            <>
              <button
                className="mt-2 rounded-md bg-amber-600 px-3 py-1.5 text-xs text-white font-medium disabled:opacity-50 hover:bg-amber-700 transition-colors"
                onClick={approve}
                disabled={approving}
              >
                {approving ? "Sealing…" : "Approve & seal receipt"}
              </button>
              {approveError && (
                <p className="mt-1 text-xs text-red-700">{approveError}</p>
              )}
            </>
          )}
          {d.decision === "act" && (
            <p className="text-xs opacity-60 italic">
              This action would execute automatically (no approval needed).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
