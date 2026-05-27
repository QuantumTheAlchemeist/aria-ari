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
