// Chip values used in TrustArchitect — scan results map to these so pre-fill works.
const READS_CHIPS = ["notes", "tasks", "documents", "contacts", "calendar", "finance records"] as const;
const ACTIONS_CHIPS = ["answer questions", "create task", "archive note", "email teammate", "export document", "delete notes", "initiate payment"] as const;
const BOTTLENECK_CHIPS = ["hallucinated answers", "unsafe writes", "stale project memory", "unclear approvals", "editable audit history"] as const;

export interface ModuleManifest {
  id?: string;
  name?: string;
  permissions?: { database?: boolean; api?: boolean; dashboard?: boolean } | string[];
  api?: { base?: string };
  database?: { tables?: string[]; migrations?: string };
  dashboard?: unknown;
  sidebar?: { href?: string; label?: string };
  routes?: { path?: string }[];
  settings?: Record<string, unknown>;
  group?: string;
  version?: string;
}

export interface ModuleRiskScan {
  moduleId: string;
  moduleName: string;
  permissions: string[];
  routes: string[];
  riskLevel: "low" | "medium" | "high";
  risks: string[];
  suggestedReads: string[];
  suggestedActions: string[];
  suggestedBottlenecks: string[];
  policyPrompt: string;
}

const HIGH_RISK = /delete|destroy|purge|send|email|payment|pay|external|export|webhook|notify/i;
const DESTRUCTIVE = /delete|destroy|purge/i;
const EXTERNAL = /send|email|payment|pay|webhook|notify/i;
const EXPORT_PAT = /export/i;

export function scanModule(manifest: ModuleManifest): ModuleRiskScan {
  const moduleId = manifest.id ?? "unknown";
  const moduleName = manifest.name ?? manifest.id ?? "Unknown Module";

  // --- Permissions ---
  const permSet = new Set<string>();
  const perms = manifest.permissions;
  if (perms) {
    if (Array.isArray(perms)) {
      perms.forEach((p) => permSet.add(p));
    } else {
      if (perms.database) permSet.add("database");
      if (perms.api) permSet.add("api");
      if (perms.dashboard) permSet.add("dashboard");
    }
  }
  if (manifest.api) permSet.add("api");
  if (manifest.database) permSet.add("database");
  if (manifest.dashboard) permSet.add("dashboard");
  const permissions = [...permSet];

  // --- Routes ---
  const routes: string[] = [];
  if (manifest.routes) routes.push(...manifest.routes.map((r) => r.path ?? "").filter(Boolean));
  if (manifest.api?.base) routes.push(manifest.api.base);
  if (manifest.sidebar?.href) routes.push(manifest.sidebar.href);

  // --- Risk analysis ---
  const risks: string[] = [];
  const allText = [moduleId, moduleName, ...routes, ...permissions].join(" ");

  let riskLevel: "low" | "medium" | "high" = "low";

  if (permissions.length === 0) {
    risks.push("No permissions declared — module behavior is unknown");
    riskLevel = "medium";
  }
  if (permSet.has("database")) {
    risks.push("Database read/write access — can persist or mutate user data");
    riskLevel = riskLevel === "low" ? "medium" : riskLevel;
  }
  if (permSet.has("api")) {
    risks.push("Exposes API routes — potential write surface for external callers");
    riskLevel = riskLevel === "low" ? "medium" : riskLevel;
  }
  if (permSet.has("database") && permSet.has("api")) {
    riskLevel = "high";
  }
  if (DESTRUCTIVE.test(allText)) {
    risks.push("Destructive action detected (delete/destroy/purge) — irreversible data loss risk");
    riskLevel = "high";
  }
  if (EXTERNAL.test(allText)) {
    risks.push("External communication detected (email/send/payment) — data leaves ARI boundary");
    riskLevel = "high";
  }
  if (EXPORT_PAT.test(allText)) {
    risks.push("Export capability detected — data may leave the platform");
    riskLevel = riskLevel === "low" ? "medium" : riskLevel;
  }
  if (manifest.settings && Object.keys(manifest.settings).length > 0) {
    risks.push("Configurable settings — module behavior can be changed at runtime");
  }
  if (risks.length === 0) {
    risks.push("Dashboard-only or read-only module — low risk surface");
  }

  // --- Map to TrustArchitect chip values ---
  const suggestedReads: string[] = [];
  if (permSet.has("database")) {
    suggestedReads.push("notes", "documents");
    if (manifest.database?.tables?.some((t) => /task/i.test(t))) suggestedReads.push("tasks");
    if (manifest.database?.tables?.some((t) => /contact/i.test(t))) suggestedReads.push("contacts");
    if (manifest.database?.tables?.some((t) => /finance|invoice|payment/i.test(t))) suggestedReads.push("finance records");
  }
  if (permSet.has("dashboard")) suggestedReads.push("documents");
  if (/task/i.test(allText)) suggestedReads.push("tasks");
  if (/calendar/i.test(allText)) suggestedReads.push("calendar");
  if (/finance|invoice|payment/i.test(allText)) suggestedReads.push("finance records");
  const uniqueReads = [...new Set(suggestedReads)].filter((r) => (READS_CHIPS as readonly string[]).includes(r));

  const suggestedActions: string[] = [];
  if (permSet.has("api") || permSet.has("database")) suggestedActions.push("answer questions");
  if (/task/i.test(allText)) suggestedActions.push("create task");
  if (/archive/i.test(allText)) suggestedActions.push("archive note");
  if (EXTERNAL.test(allText) && /email/i.test(allText)) suggestedActions.push("email teammate");
  if (EXPORT_PAT.test(allText)) suggestedActions.push("export document");
  if (DESTRUCTIVE.test(allText)) suggestedActions.push("delete notes");
  if (/payment|pay/i.test(allText)) suggestedActions.push("initiate payment");
  const uniqueActions = [...new Set(suggestedActions)].filter((a) => (ACTIONS_CHIPS as readonly string[]).includes(a));

  const suggestedBottlenecks: string[] = [];
  if (permSet.has("api") || permSet.has("database")) suggestedBottlenecks.push("hallucinated answers");
  if (DESTRUCTIVE.test(allText) || (permSet.has("database") && permSet.has("api"))) suggestedBottlenecks.push("unsafe writes");
  if (permSet.has("database")) suggestedBottlenecks.push("editable audit history");
  if (EXTERNAL.test(allText) || EXPORT_PAT.test(allText)) suggestedBottlenecks.push("unclear approvals");
  if (/task|deadline/i.test(allText)) suggestedBottlenecks.push("stale project memory");
  const uniqueBottlenecks = [...new Set(suggestedBottlenecks)].filter((b) => (BOTTLENECK_CHIPS as readonly string[]).includes(b));

  const policyPrompt = `${moduleName} (id: ${moduleId}) has ${permissions.join(", ") || "no declared"} permissions. Risk: ${riskLevel}. Detected: ${risks.join("; ")}.`;

  return {
    moduleId,
    moduleName,
    permissions,
    routes,
    riskLevel,
    risks,
    suggestedReads: uniqueReads,
    suggestedActions: uniqueActions,
    suggestedBottlenecks: uniqueBottlenecks,
    policyPrompt,
  };
}

export const PRESET_MODULES: { label: string; manifest: ModuleManifest }[] = [
  {
    label: "ARIA (this module)",
    manifest: {
      id: "aria",
      name: "ARIA",
      permissions: { database: true, api: true, dashboard: true },
      api: { base: "/api/aria" },
      database: { tables: ["receipts_sources", "receipts_ledger"] },
      sidebar: { href: "/aria", label: "ARIA" },
    },
  },
  {
    label: "Invoice Processor",
    manifest: {
      id: "invoice-processor",
      name: "Invoice Processor",
      permissions: { database: true, api: true },
      api: { base: "/api/invoices" },
      database: { tables: ["invoices", "payments"] },
      routes: [{ path: "/invoices" }, { path: "/invoices/export" }, { path: "/invoices/send" }],
      settings: { autoSend: false, currency: "USD" },
    },
  },
  {
    label: "Team Calendar",
    manifest: {
      id: "team-calendar",
      name: "Team Calendar",
      permissions: { database: true, dashboard: true },
      database: { tables: ["calendar_events", "tasks"] },
      sidebar: { href: "/calendar" },
    },
  },
  {
    label: "Read-only Dashboard",
    manifest: {
      id: "metrics-dashboard",
      name: "Metrics Dashboard",
      permissions: { dashboard: true },
      sidebar: { href: "/metrics" },
    },
  },
];
