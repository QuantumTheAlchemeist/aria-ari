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

const READS = ["notes", "tasks", "documents", "contacts", "calendar", "finance records"];
const ACTIONS = ["answer questions", "create task", "archive note", "email teammate", "export document", "delete notes", "initiate payment"];
const BOTTLENECKS = ["hallucinated answers", "unsafe writes", "stale project memory", "unclear approvals", "editable audit history"];
const WORKFLOWS: Workflow[] = ["knowledge", "tasks", "email", "documents", "finance", "custom"];

function stageCopy(stage: CleoStageId) {
  if (stage === "picker") return "Start like Cleo: choose the module's job, the records it can read, and the risky moments it must handle.";
  if (stage === "overview") return "Cleo proposes the stack first, so the user sees the whole operating model before the details.";
  if (stage === "data") return "The data layer is the RAG boundary: answer from retrieved ARI sources, or refuse.";
  if (stage === "actions") return "The action layer decides whether a proposed write can act, must draft, or must be refused.";
  if (stage === "approval") return "The approval layer makes the named human explicit before anything consequential happens.";
  if (stage === "ledger") return "The ledger layer seals the decision trail so a later edit breaks verification.";
  if (stage === "benefits") return "This is the judge-facing why: ARI modules become safe to trust, not just fast to create.";
  return "Seal the policy as a trust receipt. Any later policy change should create a new receipt.";
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
  const [actions, setActions] = useState<string[]>(["answer questions", "create task", "archive note", "delete notes"]);
  const [bottlenecks, setBottlenecks] = useState<string[]>(["hallucinated answers", "unsafe writes", "editable audit history"]);
  const [stageId, setStageId] = useState<CleoStageId>("picker");
  const [askAnswer, setAskAnswer] = useState("");
  const [policy, setPolicy] = useState("");
  const [sealing, setSealing] = useState(false);

  useEffect(() => {
    if (!scannedModule) return;
    setModuleName(scannedModule.moduleName);
    if (scannedModule.suggestedReads.length > 0) setReads(scannedModule.suggestedReads);
    if (scannedModule.suggestedActions.length > 0) setActions(scannedModule.suggestedActions);
    if (scannedModule.suggestedBottlenecks.length > 0) setBottlenecks(scannedModule.suggestedBottlenecks);
    setStageId("overview");
    setAskAnswer("");
  }, [scannedModule]);

  const input = useMemo(
    () => ({ moduleName, workflow, reads, actions, bottlenecks, owner: "ARI user" }),
    [moduleName, workflow, reads, actions, bottlenecks]
  );
  const stage = CLEO_STAGES.find((s) => s.id === stageId) ?? CLEO_STAGES[0];
  const diagram = stageId === "picker" ? null : diagramFor(stageId, input);

  function toggle(v: string, list: string[], setList: (x: string[]) => void) {
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  function next() {
    setAskAnswer("");
    if (stage.next) setStageId(stage.next);
  }

  async function seal() {
    setSealing(true);
    try {
      const r = await fetch(`${API_BASE}/trust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await r.json();
      setPolicy(data.policy ?? buildFinalPolicy(input));
      onReceipt();
    } catch {
      setPolicy(buildFinalPolicy(input));
    } finally {
      setSealing(false);
    }
  }

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <div>
        <h3 className="font-semibold">ARIA Trust Architect</h3>
        <p className="text-sm text-neutral-500">
          Design the trust stack for any ARI module — layer by layer — then seal the policy as a verifiable receipt.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {CLEO_STAGES.map((s) => (
          <button
            key={s.id}
            className={`rounded-full border px-3 py-1 ${s.id === stageId ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-50"}`}
            onClick={() => { setStageId(s.id); setAskAnswer(""); }}
          >
            {s.title}
          </button>
        ))}
      </div>

      <section className="rounded-md border p-3">
        <div className="text-xs font-medium uppercase text-neutral-500">{stage.title}</div>
        <p className="mt-1 text-sm text-neutral-700">{stageCopy(stageId)}</p>
      </section>

      {stageId === "picker" && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-xs text-neutral-500">Module / workflow name</span>
              <input
                className="mt-1 w-full rounded-md border bg-transparent px-3 py-2"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="text-xs text-neutral-500">Workflow</span>
              <select
                className="mt-1 w-full rounded-md border bg-transparent px-3 py-2"
                value={workflow}
                onChange={(e) => setWorkflow(e.target.value as Workflow)}
              >
                {WORKFLOWS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-neutral-500">Can read</p>
            <div className="flex flex-wrap gap-2">
              {READS.map((x) => (
                <button
                  key={x}
                  className={`rounded-full border px-3 py-1 text-xs ${reads.includes(x) ? "bg-emerald-50 border-emerald-300" : "hover:bg-neutral-50"}`}
                  onClick={() => toggle(x, reads, setReads)}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-neutral-500">Can propose actions</p>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((x) => (
                <button
                  key={x}
                  className={`rounded-full border px-3 py-1 text-xs ${actions.includes(x) ? "bg-blue-50 border-blue-300" : "hover:bg-neutral-50"}`}
                  onClick={() => toggle(x, actions, setActions)}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-neutral-500">Known risks</p>
            <div className="flex flex-wrap gap-2">
              {BOTTLENECKS.map((x) => (
                <button
                  key={x}
                  className={`rounded-full border px-3 py-1 text-xs ${bottlenecks.includes(x) ? "bg-amber-50 border-amber-300" : "hover:bg-neutral-50"}`}
                  onClick={() => toggle(x, bottlenecks, setBottlenecks)}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {stageId !== "picker" && <CleoDiagram diagram={diagram} />}

      {stage.asks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stage.asks.map((q) => (
            <button
              key={q}
              className="rounded-md border px-3 py-1 text-xs hover:bg-neutral-50"
              onClick={() => setAskAnswer(answerAsk(q))}
            >
              {q}
            </button>
          ))}
        </div>
      )}
      {askAnswer && (
        <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700">{askAnswer}</div>
      )}

      <div className="flex gap-2">
        {stage.next && (
          <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700" onClick={next}>
            Continue: {CLEO_STAGES.find((s) => s.id === stage.next)?.title}
          </button>
        )}
        {stageId === "final" && (
          <button
            className="rounded-md bg-purple-700 px-4 py-2 text-sm text-white hover:bg-purple-600 disabled:opacity-50"
            onClick={seal}
            disabled={sealing}
          >
            {sealing ? "Sealing…" : "Seal trust receipt"}
          </button>
        )}
      </div>

      {stageId === "final" && (
        <pre className="whitespace-pre-wrap rounded-md border bg-neutral-50 p-3 text-xs text-neutral-800">
          {policy || buildFinalPolicy(input)}
        </pre>
      )}
    </div>
  );
}
