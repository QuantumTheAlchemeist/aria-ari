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
