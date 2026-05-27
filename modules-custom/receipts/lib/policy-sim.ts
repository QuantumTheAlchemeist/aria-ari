import { evaluateConsequence, type ConsequenceDecision } from "./consequence";
import type { ModuleRiskScan } from "./module-scan";

export interface SimScenario {
  id: string;
  label: string;
  description: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  affectedCount?: number;
  irreversible?: boolean;
  kind: "answer" | "action";
}

export interface SimResult {
  scenario: SimScenario;
  decision: ConsequenceDecision;
  policyLine: string;
}

export function scenariosForScan(scan: ModuleRiskScan): SimScenario[] {
  const scenarios: SimScenario[] = [];

  scenarios.push({
    id: "summarize",
    label: "Summarize notes",
    description: "Ask the module a grounded question",
    toolName: "answer_question",
    toolInput: { query: "Summarize recent notes" },
    kind: "answer",
  });

  if (scan.suggestedActions.includes("create task")) {
    scenarios.push({
      id: "create_task",
      label: "Create a task",
      description: "Ask the module to create a task",
      toolName: "create_task",
      toolInput: { title: "Review sprint backlog" },
      kind: "action",
    });
  }

  if (scan.suggestedActions.includes("archive note")) {
    scenarios.push({
      id: "archive_notes",
      label: "Archive 3 notes",
      description: "Archive 3 notes from last quarter",
      toolName: "archive_notes",
      toolInput: { count: 3 },
      affectedCount: 3,
      kind: "action",
    });
  }

  if (scan.suggestedActions.includes("export document")) {
    scenarios.push({
      id: "export_docs",
      label: "Export documents",
      description: "Export all documents to PDF",
      toolName: "export_documents",
      toolInput: { format: "pdf" },
      kind: "action",
    });
  }

  if (scan.suggestedActions.includes("email teammate")) {
    scenarios.push({
      id: "email_team",
      label: "Email 15 teammates",
      description: "Broadcast email to the team",
      toolName: "draft_email",
      toolInput: { recipientCount: 15, subject: "Sprint update" },
      affectedCount: 15,
      kind: "action",
    });
  }

  if (scan.suggestedActions.includes("delete notes")) {
    scenarios.push({
      id: "delete_few",
      label: "Delete 3 notes",
      description: "Delete 3 archived notes",
      toolName: "delete_notes",
      toolInput: { count: 3 },
      affectedCount: 3,
      irreversible: true,
      kind: "action",
    });
    scenarios.push({
      id: "delete_bulk",
      label: "Delete 60 notes",
      description: "Bulk delete — exceeds safety ceiling",
      toolName: "delete_notes",
      toolInput: { count: 60 },
      affectedCount: 60,
      irreversible: true,
      kind: "action",
    });
  }

  if (scan.suggestedActions.includes("initiate payment")) {
    scenarios.push({
      id: "payment",
      label: "Initiate payment",
      description: "Trigger a payment to a vendor",
      toolName: "initiate_payment",
      toolInput: { amount: 500, currency: "USD" },
      kind: "action",
    });
  }

  scenarios.push({
    id: "ungrounded",
    label: "Ask unknown fact",
    description: "Query outside module knowledge",
    toolName: "answer_question",
    toolInput: { query: "What is our Q4 revenue forecast for the Mars division?" },
    kind: "answer",
  });

  return scenarios;
}

const ANSWER_TOOL = "answer_question";

export function simulateScenario(scenario: SimScenario, userId: string): SimResult {
  if (scenario.toolName === ANSWER_TOOL) {
    const isUnknown = scenario.id === "ungrounded";
    const decision: ConsequenceDecision = {
      decision: isUnknown ? "refuse" : "act",
      tier: "none",
      reason: isUnknown
        ? "Query is outside grounded knowledge — refusing to answer without a source."
        : "Answer grounded in cited sources — no approval needed.",
      preview: isUnknown
        ? `No grounded source for "${String(scenario.toolInput.query)}" — refused.`
        : "Answer synthesized with inline citations.",
      inputHash: "",
      profile: {
        toolName: scenario.toolName,
        label: "Answer question",
        sideEffects: [],
        defaultTier: "none",
        producesDraft: false,
        preview: () => "",
      },
    };
    const policyLine = isUnknown
      ? "RAG policy: refuse when grounding score < threshold (no hallucination)"
      : "RAG policy: answer with [n] inline citations from verified sources";
    return { scenario, decision, policyLine };
  }

  const decision = evaluateConsequence({
    toolName: scenario.toolName,
    toolInput: scenario.toolInput,
    userId,
    affectedCount: scenario.affectedCount,
    irreversible: scenario.irreversible,
  });

  let policyLine = "Action policy: safe low-risk action — executes immediately";
  if (decision.decision === "refuse") {
    policyLine = "Refusal policy: bulk operation exceeds safety ceiling (50 items) — refused";
  } else if (decision.decision === "draft" && decision.tier === "typed") {
    policyLine = "Approval policy: typed confirmation required — high blast radius / irreversible";
  } else if (decision.decision === "draft") {
    policyLine = "Approval policy: one-tap approval required — external side effects";
  }

  return { scenario, decision, policyLine };
}
