export type Workflow = "knowledge" | "tasks" | "email" | "documents" | "finance" | "custom";
export type CleoStageId = "picker" | "overview" | "data" | "actions" | "approval" | "ledger" | "benefits" | "final";
export type DiagramKind = "stack" | "step" | "impact" | "policy";

export interface TrustInput {
  moduleName: string;
  workflow: Workflow;
  reads: string[];
  actions: string[];
  bottlenecks: string[];
  owner?: string;
}

export const CLEO_STAGES: { id: CleoStageId; title: string; next?: CleoStageId; asks: string[] }[] = [
  { id: "picker", title: "Shape the module", next: "overview", asks: ["What should it read?", "What can it do?"] },
  { id: "overview", title: "Module stack", next: "data", asks: ["Why these layers?", "Where does RAG fit?"] },
  { id: "data", title: "Data layer", next: "actions", asks: ["What if sources are missing?", "Can it hallucinate?"] },
  { id: "actions", title: "Action layer", next: "approval", asks: ["Which actions are risky?", "What gets refused?"] },
  { id: "approval", title: "Approval layer", next: "ledger", asks: ["Who signs?", "Can approval be replayed?"] },
  { id: "ledger", title: "Receipt ledger", next: "benefits", asks: ["What does Verify check?", "What if someone edits history?"] },
  { id: "benefits", title: "What changes", next: "final", asks: ["Why does ARI need this?", "What wins the demo?"] },
  { id: "final", title: "Seal policy", asks: ["What is sealed?", "Can I edit after sealing?"] },
];

export const CLEO_PRIMITIVES = [
  { id: "document_qa", name: "Document Q&A", role: "citation-first answers from ARI notes and documents", trustRule: "answer only when retrieved sources pass the grounding threshold; otherwise refuse" },
  { id: "drafting", name: "Drafting agent", role: "drafts notes, summaries, emails, or project updates from grounded context", trustRule: "drafts only; anything leaving ARI needs named approval" },
  { id: "sentinel", name: "Sentinel", role: "watches deadlines, stale notes, blocked tasks, or risky workflow states", trustRule: "alerts only; never silently changes user data" },
  { id: "memory", name: "Memory layer", role: "keeps project decisions and institutional context searchable", trustRule: "records source, timestamp, and reason for every memory update" },
  { id: "connector", name: "Custom connector", role: "lets the module propose actions in ARI tools", trustRule: "all writes pass through act/draft/refuse consequence gating" },
  { id: "named_signer", name: "Named-signer", role: "requires a human approval before risky action execution", trustRule: "approval tokens are scoped, hashed, and short-lived" },
  { id: "audit_grade", name: "Audit-grade ledger", role: "seals answers, refusals, policies, approvals, and actions", trustRule: "hash-chain verification flags tampering" },
] as const;

const purpose: Record<Workflow, string> = {
  knowledge: "answer from personal knowledge without inventing unsupported facts",
  tasks: "turn user intent into task changes with reversible, consented writes",
  email: "draft communication safely without sending externally on its own",
  documents: "summarize, organize, and export documents with review before sharing",
  finance: "inspect finance records while refusing autonomous payments or destructive changes",
  custom: "operate only inside the explicit data and action boundaries below",
};

export function classifyAction(action: string): "act" | "draft" | "refuse" {
  const a = action.toLowerCase();
  if (a.includes("delete") || a.includes("payment") || a.includes("send external")) return "refuse";
  if (a.includes("email") || a.includes("archive") || a.includes("export") || a.includes("update")) return "draft";
  return "act";
}

export function selectedLayers(input: TrustInput) {
  const ids = new Set(["document_qa", "memory", "connector", "named_signer", "audit_grade"]);
  if (input.workflow === "email" || input.workflow === "documents") ids.add("drafting");
  if (input.workflow === "tasks" || input.bottlenecks.some((b) => /deadline|stale|blocked|sla/i.test(b))) ids.add("sentinel");
  return CLEO_PRIMITIVES.filter((p) => ids.has(p.id));
}

export function diagramFor(stage: CleoStageId, input: TrustInput) {
  const layers = selectedLayers(input);
  if (stage === "overview") return { kind: "stack" as const, title: `${input.moduleName} trust stack`, layers: layers.map((l) => ({ name: l.name, role: l.role, primitive: l.name })) };
  if (stage === "data") return { kind: "step" as const, title: "Grounded answer flow", input: input.reads.join(" + ") || "ARI notes", node: { name: "Document Q&A", primitive: "RAG" }, output: "cited answer or refusal", note: "no source means no answer" };
  if (stage === "actions") return { kind: "step" as const, title: "Action gate", input: "proposed action", node: { name: "Consequence engine", primitive: "act/draft/refuse" }, output: "execute, approve, or refuse", note: "risky writes need consent" };
  if (stage === "approval") return { kind: "step" as const, title: "Approval flow", input: "draft action", node: { name: "Named-signer", primitive: "HMAC token" }, output: "sealed action receipt", note: "tokens are scoped, short-lived" };
  if (stage === "ledger") return { kind: "step" as const, title: "Receipt verification", input: "answer or action", node: { name: "Hash chain", primitive: "audit-grade ledger" }, output: "verified receipt", note: "tampering turns red" };
  if (stage === "benefits") return { kind: "impact" as const, title: "What changes in ARI", items: [
    { label: "Module design", before: "implicit", after: "policy receipt" },
    { label: "Answers", before: "trust me", after: "cited/refused" },
    { label: "Actions", before: "blind write", after: "approved/refused" },
    { label: "History", before: "editable log", after: "verified ledger" },
  ] };
  return { kind: "policy" as const, title: "Sealed module policy", status: "ready to seal", receiptKind: "trust" };
}

export function answerAsk(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("rag") || q.includes("source")) return "The data layer retrieves ARI sources first. If no source passes the grounding threshold, the module refuses instead of inventing an answer.";
  if (q.includes("risky") || q.includes("refused")) return "Risk is based on action type, blast radius, irreversibility, and whether data leaves ARI. Bulk delete and payment-style actions are refused in the demo.";
  if (q.includes("verify") || q.includes("edit")) return "Verify recomputes prompt hashes, output hashes, receipt hashes, and prev_hash links. A silent edit breaks the chain and flags the row.";
  if (q.includes("ari")) return "ARI's advantage is fast module creation. Receipts adds the missing trust contract those modules need before users rely on them.";
  if (q.includes("sign") || q.includes("replay")) return "The named signer is the ARI user who approved the action. Approval tokens are HMAC-signed, scoped to the exact tool and input, and expire in 5 minutes.";
  if (q.includes("layer") || q.includes("stack")) return "Layers are selected based on the workflow type and declared bottlenecks. Sentinel activates for task workflows with deadline risks.";
  if (q.includes("seal") || q.includes("after")) return "Once sealed, the policy receipt is in the hash chain. Edits require a new trust receipt — you can't change history, only add to it.";
  if (q.includes("win") || q.includes("judge")) return "ARI creates modules fast. Receipts makes those modules safe to trust. The tamper-detection demo is the most memorable moment.";
  return "The Trust Architect keeps the module narrow: declared data, declared actions, explicit approvals, explicit refusals, and a sealed receipt.";
}

export function buildFinalPolicy(input: TrustInput): string {
  const reads = input.reads.length ? input.reads.join(", ") : "no declared data sources";
  const owner = input.owner?.trim() || "the ARI user";
  const actionLines = (input.actions.length ? input.actions : ["answer questions"]).map((a) => {
    const d = classifyAction(a);
    if (d === "act") return `- ACT: "${a}" is low-risk and can be recorded immediately.`;
    if (d === "draft") return `- DRAFT: "${a}" requires a consequence preview and user approval before execution.`;
    return `- REFUSE: "${a}" is too risky for autonomous execution in this module.`;
  });
  return [
    `Module: ${input.moduleName}`,
    `Purpose: ${purpose[input.workflow]}.`,
    `Data boundary: may read ${reads}; must not read undeclared ARI data sources.`,
    `RAG policy: answer only from retrieved ARI sources; refuse when grounding is weak or missing.`,
    `Action boundary:`,
    ...actionLines,
    `Approval policy: DRAFT actions require visible consequence preview and approval from ${owner}.`,
    `Refusal policy: REFUSE actions must not execute; offer a safer draft, smaller scope, or manual handoff.`,
    `Receipt policy: every answer, refusal, approval, policy, and refused action must be sealed into the Receipts ledger.`,
    `Owner handoff: ${owner} owns policy changes and must reseal a new trust receipt after edits.`,
  ].join("\n");
}
