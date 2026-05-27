# Receipts — ARI Module Build Plan (ARI.HACK handoff, execution-ready)

> **YOU ARE THE BUILDING AGENT (Claude Code at ARI.HACK).** This file contains *everything* you need. You do NOT have the authors' other repos — all load-bearing code is embedded here, complete. Your machine should have ARI.Software installed — **if `modules-custom/` doesn't exist, do STEP 0 below to install it first** (ARI is an installer, not a public git clone). Build top-to-bottom. Checkboxes (`- [ ]`) track progress.

---

## ⚡ QUICK START (do this first, literally)

```bash
# 1. Is ARI installed? (custom modules live here.) If not, do STEP 0 below FIRST.
ls modules-custom/ 2>/dev/null && echo "FOUND modules-custom — ARI is here, proceed" || echo "ARI NOT FOUND — do STEP 0 (install from https://ari.software/docs/installation) before anything else"

# 2. Make the module folder
mkdir -p modules-custom/receipts/{app,api,components,hooks,lib,database,__tests__}

# 3. Do PHASE 0 recon (below) — fills in the ONLY ARI-specific unknowns
# 4. Do PHASE A — build + test the pure core in isolation (no ARI runtime needed)
# 5. Do PHASE B — wire into ARI; demo the spine
# 6. PHASE C Trust Studio finish, PHASE D submit
```

---

## STEP 0 — Install ARI.Software first (skip if `modules-custom/` already exists)

This module installs **into** a running ARI.Software instance. If `ls modules-custom/` above did NOT find it, set ARI up before doing anything else:

- [ ] **1. Install ARI.** Open **https://ari.software/docs/installation** and follow the guide for this OS (macOS / Linux / Windows). ARI is distributed via that installer — there is **no public GitHub repo to clone**. (Verified: the organizers' own prep instructions point here.)
- [ ] **2. Confirm the one hard prerequisite:** an **active paid Claude Code account** — `/ari-create-module` and the AI features run through it.
- [ ] **3. Update ARI** to latest (they ship frequent updates): **https://ari.software/docs/updating**.
- [ ] **4. Skim the module docs once:** **https://ari.software/docs/creating-modules** and **https://ari.software/docs/module-structure** (these are the source of the conventions used below).
- [ ] **5. Start ARI** with the dev command from the install guide and confirm it loads in the browser.
- [ ] **6. Verify the module dirs exist** at the ARI repo root: `ls modules-core/ modules-custom/` — both should be present (`modules-core/module-template/` is what Phase 0 reads). If `modules-custom/` is missing, `mkdir -p modules-custom`.

> Do not start Phase 0 until ARI runs locally and you can `cat modules-core/module-template/module.json`. Everything after this assumes a working ARI install.

---

**Golden rules (do not violate):**
1. **Determinism over cleverness.** The demo must never depend on a live LLM call. (LLM is an optional garnish in Phase A, clearly marked.)
2. **All ARI coupling lives in 2 files** (`lib/ari-adapter.ts`, `lib/api-base.ts`). Fill them once in Phase 0. Never scatter ARI-specific imports elsewhere.
3. **Honour the Cut Line.** Phase A + B = the winning demo. Do NOT start Phase C until the spine demos cleanly.
4. **Don't add npm dependencies.** ARI already ships `drizzle-orm`, `zod`, `vitest`, React, Next, Tailwind. `crypto` is built into Node. If a tool is missing, note it and continue.
5. **Commit after every task.** Small commits.
6. **YAGNI.** Build exactly what's below. No extra features.

---

## What you're building (1 minute)

`Receipts` — a custom ARI **Trust Studio** that makes ARI's AI and AI-built modules **verifiable**. The Cleo-style architect designs the policy; the original Receipts engine enforces and audits it:
- **Grounded:** deterministic RAG-style retrieval builds answers from cited sources, or **refuses** if not grounded (no hallucination).
- **Gated:** consequential actions are classified `act` / `draft` / `refuse` and need approval (HMAC token).
- **Verifiable:** every interaction is sealed into a **hash-chained, tamper-evident ledger** with a one-click verifier.
- **Architected:** the full org-brain Cleo pattern — picker, staged walkthrough, diagrams, Continue controls, final proposal — turns a proposed ARI module/workflow into a policy receipt.

**Judges score:** Usefulness · Creativity · Execution · Integration (fits ARI) · Design. This hits all five.

**The pitch (say to judges):**
> "ARI lets anyone build AI modules fast. Receipts makes those modules safe to trust: before a module acts, it gets a policy; every answer has sources, every risky action needs consent, and every interaction leaves a tamper-evident receipt you can independently check."

**The 90-second demo you are building toward:**
1. Ask a seeded question → cited answer with `[1][2]`.
2. Ask something off-corpus → **refusal**.
3. Use **Cleo Trust Architect** → picker → stack overview → data/action/approval/ledger stages → final policy → seal a module trust receipt.
4. Click the action buttons → consequence cards show **act / draft / refuse**; "delete 60 notes" is **refused** (safety ceiling).
5. Open the ledger → every answer, refusal, trust review, and action is a receipt.
6. **Verify** → all green ✓. **Tamper** (silently edits one receipt) → **Verify** → chain breaks, the altered row turns **red**.
7. Open the pre-seeded **"Vineyard Block A"** receipt → a *refused* organic-spray decision (origin-story closer).

---

## 🎯 CUT LINE (when time is short)

| Phase | Tasks | Status target |
|---|---|---|
| **0 — Recon** | fill 2 coupling files | 5 min, do first |
| **A — Pure core (tested, no ARI)** | hash, receipts, RAG-style retrieval, answer, consequence + tests all green | the foundation |
| **B — ARI integration (THE SPINE — ship no matter what)** | schema, seed, ask, list, tamper routes + Ask/Ledger UI + the **tamper→red** demo | **this wins** |
| **C — Trust Studio finish** | C0 Trust Architect first; C1/C2 gated-action route + consequence cards if time | makes it irresistible |
| **D — Polish + submit** | widget, README/disclosure, public repo, video | required to submit |

**Time budget (3h):** Phase 0+A 60m · B 75m · C 30m · D 20m. If you reach 6:00 PM, build C0 if it is not done, then freeze C1/C2 and do D.

**Phase C priority:** if there is only time for one item, build **C0 Trust Architect** before action cards. It is the most ARI-native part of the combined plan: ARI creates modules; Receipts gives those modules trust policies.

---

## PHASE 0 — Recon: fill the only ARI-specific unknowns (5 min)

There are a few ARI-specific conventions this plan can't know about your installed build. Find them now, write them into the adapter files, and the rest of the plan just works.

- [ ] **Step 1: Discover the conventions.** Run these and read the output:

```bash
# (a) How does a module get the DB client? (Drizzle)
grep -rn "drizzle\|from .*['\"].*db" modules-core/module-template/ | head -20
# (b) How does a route resolve the current user? (auth/session/userId)
grep -rniE "userid|session|auth|getUser|currentUser" modules-core/module-template/api/ | head -20
# (c) Read a real example API route end-to-end (imports + handler shape)
find modules-core/module-template/api -name "route.ts" | head -1 | xargs cat
# (d) What is the API base path for a module's routes? Inspect manifest + routing
cat modules-core/module-template/module.json
grep -rn "api" modules-core/module-template/module.json
# (e) UI primitives available to reuse (buttons/cards) — optional, Tailwind fallback is fine
ls modules-core/module-template/components/ 2>/dev/null
```

Also open the docs page `/docs/module-library` in the running app for a worked example if the grep is ambiguous.

- [ ] **Step 2: Create `modules-custom/receipts/module.json`** (do not assume the scaffold made this correctly):

```json
{
  "id": "receipts",
  "name": "Receipts",
  "group": "Productivity",
  "description": "Verifiable trust layer for ARI's AI — cited answers, gated actions, and tamper-evident receipts.",
  "version": "0.1.0",
  "icon": "ShieldCheck",
  "enabled": true,
  "fullscreen": false,
  "menuPriority": 50,
  "permissions": { "database": true, "api": true, "dashboard": true },
  "database": { "migrations": "database" },
  "dashboard": { "widget": { "component": "DashboardWidget", "title": "Receipts", "size": "md" } },
  "settings": {},
  "routes": [{ "path": "/receipts", "page": "app/page.tsx" }]
}
```

If the template's manifest shape differs, preserve the template-required fields, but keep: id `receipts`, route `/receipts`, API permission enabled, DB permission enabled, dashboard widget enabled.

- [ ] **Step 3: Create `modules-custom/receipts/lib/api-base.ts`** (client-safe; the ONE place the API path is defined):

```ts
// PHASE 0: set this to your ARI build's module API convention.
// Most ARI modules expose routes at /api/<moduleId>/<route>. If recon shows a
// different convention (e.g. /modules/receipts/api), change ONLY this line.
export const API_BASE = "/api/receipts";
```

- [ ] **Step 4: Create `modules-custom/receipts/lib/ari-adapter.ts`** (server-only; the ONE place ARI's DB + auth are wired). Replace the two marked lines with what recon found:

```ts
// PHASE 0: the ONLY file that imports ARI internals. Fill the two TODOs.
// ---- DB CLIENT ----
// Replace this import with the db client your template uses (from recon step a).
import { db } from "@/lib/db"; // TODO: use the template's real db import path

export function getDb() {
  return db; // Drizzle client
}

// ---- CURRENT USER ----
// Replace the body with the template's real auth/session resolution (recon step b).
// FALLBACK FOR THE DEMO: a single fixed user UUID. This makes the whole demo work
// even if you can't wire real auth in time. (If RLS blocks inserts with a fixed
// uid, see Troubleshooting → "RLS blocks inserts".)
export async function getUserId(_req: Request): Promise<string> {
  // TODO (preferred): return the real authenticated user id.
  return "00000000-0000-0000-0000-000000000001";
}
```

- [ ] **Step 5: Confirm vitest runs.** `npx vitest --version` → if it errors, the project may use a different runner; check `package.json` `scripts.test`. You'll run pure-core tests in Phase A.

> ✅ **Phase 0 done when:** both files exist and you know your module's API base path. You will not touch ARI internals again outside `ari-adapter.ts`.

---

## PHASE A — Pure core, built & tested in isolation (no ARI runtime)

Everything here is pure TypeScript (only `node:crypto`). It runs under vitest without ARI. **Get all tests green before integrating** — this de-risks the whole build.

### Task A1: hashing primitives

**File:** Create `modules-custom/receipts/lib/hash.ts`

- [ ] **Step 1: Write it:**

```ts
import { createHash } from "node:crypto";

/** Stable canonical JSON: keys sorted recursively, so structurally identical
 *  inputs hash identically regardless of key order. */
export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalJson).join(",") + "]";
  const obj = v as Record<string, unknown>;
  return "{" + Object.keys(obj).sort()
    .map((k) => JSON.stringify(k) + ":" + canonicalJson(obj[k])).join(",") + "}";
}

export function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
```

- [ ] **Step 2: Commit.** `git add -A && git commit -m "feat(receipts): hashing primitives"`

### Task A2: hash-chained ledger (TDD)

**Files:** Create `lib/receipts.ts`, `__tests__/receipts.test.ts`

- [ ] **Step 1: Failing test** — `__tests__/receipts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildContent, sealReceipt, verifyChain, GENESIS_HASH, type Receipt } from "../lib/receipts";

function chain(): Receipt[] {
  const r0 = sealReceipt(buildContent({ seq: 0, kind: "answer", prompt: "q0", output: "a0", citation_ids: ["s1"], created_at: "2026-05-27T00:00:00Z" }), GENESIS_HASH);
  const r1 = sealReceipt(buildContent({ seq: 1, kind: "refusal", prompt: "q1", output: "no", citation_ids: [], created_at: "2026-05-27T00:01:00Z" }), r0.receipt_hash);
  return [r0, r1];
}

describe("receipt ledger", () => {
  it("verifies an untampered chain", () => { expect(verifyChain(chain()).ok).toBe(true); });
  it("detects an edited output (in-place tamper)", () => {
    const c = chain(); c[0] = { ...c[0], output: "a0-HACKED" };
    const res = verifyChain(c); expect(res.ok).toBe(false); expect(res.brokenAtSeq).toBe(0);
  });
  it("detects a removed link via prev_hash break", () => {
    const res = verifyChain([chain()[1]]); expect(res.ok).toBe(false); expect(res.brokenAtSeq).toBe(1);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.** `npx vitest run modules-custom/receipts/__tests__/receipts.test.ts`

- [ ] **Step 3: Implement `lib/receipts.ts`:**

```ts
import { canonicalJson, sha256Hex } from "./hash";

export type ReceiptKind = "answer" | "refusal" | "action" | "trust";
export const GENESIS_HASH = "0".repeat(64);

export interface ReceiptContent {
  seq: number; kind: ReceiptKind; prompt: string; prompt_hash: string;
  output: string; output_hash: string; citation_ids: string[];
  decision: string | null; created_at: string;
}
export interface Receipt extends ReceiptContent { prev_hash: string; receipt_hash: string; }

export function buildContent(a: {
  seq: number; kind: ReceiptKind; prompt: string; output: string;
  citation_ids: string[]; decision?: string | null; created_at: string;
}): ReceiptContent {
  return {
    seq: a.seq, kind: a.kind, prompt: a.prompt, prompt_hash: sha256Hex(a.prompt),
    output: a.output, output_hash: sha256Hex(a.output), citation_ids: a.citation_ids,
    decision: a.decision ?? null, created_at: a.created_at,
  };
}

export function computeReceiptHash(c: ReceiptContent, prevHash: string): string {
  return sha256Hex(canonicalJson({ ...c, prev_hash: prevHash }));
}
export function sealReceipt(c: ReceiptContent, prevHash: string): Receipt {
  return { ...c, prev_hash: prevHash, receipt_hash: computeReceiptHash(c, prevHash) };
}

export interface VerifyResult { ok: boolean; brokenAtSeq?: number; reason?: string; }

/** Recompute the whole chain. Catches in-place content edits, reseal-less
 *  tampering, and reorder/insert/remove. */
export function verifyChain(receipts: Receipt[]): VerifyResult {
  const ordered = [...receipts].sort((a, b) => a.seq - b.seq);
  let prev = GENESIS_HASH;
  for (const r of ordered) {
    if (r.prev_hash !== prev)
      return { ok: false, brokenAtSeq: r.seq, reason: "prev_hash mismatch (entry inserted, removed, or reordered)" };
    if (r.prompt_hash !== sha256Hex(r.prompt) || r.output_hash !== sha256Hex(r.output))
      return { ok: false, brokenAtSeq: r.seq, reason: "content hash mismatch (prompt/output edited after sealing)" };
    const content: ReceiptContent = {
      seq: r.seq, kind: r.kind, prompt: r.prompt, prompt_hash: r.prompt_hash,
      output: r.output, output_hash: r.output_hash, citation_ids: r.citation_ids,
      decision: r.decision, created_at: r.created_at,
    };
    if (computeReceiptHash(content, r.prev_hash) !== r.receipt_hash)
      return { ok: false, brokenAtSeq: r.seq, reason: "receipt_hash mismatch (record altered)" };
    prev = r.receipt_hash;
  }
  return { ok: true };
}

/** Map a sealed Receipt to a DB row (Drizzle column keys). Defined ONCE here. */
export function toRow(r: Receipt, userId: string) {
  return {
    receiptHash: r.receipt_hash, userId, seq: r.seq, kind: r.kind,
    prompt: r.prompt, promptHash: r.prompt_hash, output: r.output, outputHash: r.output_hash,
    citationIds: r.citation_ids, decision: r.decision, prevHash: r.prev_hash,
    // `created_at` is part of the receipt hash, so persist the exact string
    // used during sealing. Do NOT let Postgres replace/reformat it.
    createdAt: r.created_at,
  };
}

/** Map a DB row back to a Receipt. Defined ONCE here. */
export function fromRow(row: any): Receipt {
  return {
    seq: row.seq, kind: row.kind, prompt: row.prompt, prompt_hash: row.promptHash,
    output: row.output, output_hash: row.outputHash, citation_ids: row.citationIds ?? [],
    decision: row.decision ?? null,
    created_at: String(row.createdAt ?? ""),
    prev_hash: row.prevHash, receipt_hash: row.receiptHash,
  };
}
```

- [ ] **Step 4: Run, expect PASS.** `npx vitest run modules-custom/receipts/__tests__/receipts.test.ts`
- [ ] **Step 5: Commit.** `git add modules-custom/receipts && git commit -m "feat(receipts): tamper-evident hash-chained ledger + tests"`

### Task A3: retrieval + cited answer / refusal (TDD)

**Files:** Create `lib/retrieval.ts`, `lib/answer.ts`, `__tests__/answer.test.ts`

- [ ] **Step 1: Failing test** — `__tests__/answer.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { answerFromSources } from "../lib/answer";
import type { Source } from "../lib/retrieval";

const SOURCES: Source[] = [
  { id: "note-roadmap", title: "Q3 Roadmap", text: "The Q3 roadmap prioritizes the billing rewrite and the mobile app beta. Billing migration starts in July." },
  { id: "note-standup", title: "Standup", text: "Maria is leading the billing rewrite. We agreed to freeze new feature requests until the billing migration ships." },
];

describe("answerFromSources", () => {
  it("answers a grounded question with a citation marker", () => {
    const r = answerFromSources("Who is leading the billing rewrite?", SOURCES);
    expect(r.kind).toBe("answer");
    expect(r.citations.length).toBeGreaterThan(0);
    expect(r.text).toMatch(/\[1\]/);
  });
  it("refuses an ungrounded question", () => {
    const r = answerFromSources("What is the airspeed of an unladen swallow?", SOURCES);
    expect(r.kind).toBe("refusal");
    expect(r.citations.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.** `npx vitest run modules-custom/receipts/__tests__/answer.test.ts`

- [ ] **Step 3: `lib/retrieval.ts`:**

```ts
export interface Source { id: string; title: string; text: string; }
export interface Chunk { sourceId: string; sourceTitle: string; snippet: string; score: number; }

const STOP = new Set(["the","a","an","is","are","of","to","and","or","in","on","for","do","does","should","we","i","it","this","that","with","at","be","can","my","who","what","when","where","how","leading","lead"]);

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t));
}

/** Score each source by fraction of (content) query terms present; return top-k
 *  with a best-matching snippet. */
export function retrieve(query: string, sources: Source[], k = 3): Chunk[] {
  const q = new Set(tokens(query));
  if (q.size === 0) return [];
  return sources.map((s) => {
    const st = new Set(tokens(s.text));
    const overlap = [...q].filter((t) => st.has(t)).length;
    const score = overlap / q.size;
    const sentences = s.text.split(/(?<=[.!?])\s+/);
    const hit = sentences.find((sen) => tokens(sen).some((t) => q.has(t))) ?? s.text;
    return { sourceId: s.id, sourceTitle: s.title, snippet: hit.slice(0, 220), score };
  }).filter((c) => c.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
}
```

- [ ] **Step 4: `lib/answer.ts`:**

```ts
import { retrieve, type Source } from "./retrieval";

/** Minimum fraction of query terms grounded in a source before we answer.
 *  Below this → refuse instead of hallucinate. */
export const MIN_SCORE = 0.34;

export interface Citation { id: string; title: string; snippet: string; }
export interface AnswerResult { kind: "answer" | "refusal"; text: string; citations: Citation[]; }

export function answerFromSources(query: string, sources: Source[]): AnswerResult {
  const chunks = retrieve(query, sources, 3);
  if (chunks.length === 0 || chunks[0].score < MIN_SCORE) {
    return { kind: "refusal", text: "I can't ground an answer to that in your notes, so I won't answer. (No source passed the citation threshold.)", citations: [] };
  }
  const used = chunks.filter((c) => c.score >= MIN_SCORE * 0.6);
  const text = used.map((c, i) => `${c.snippet}${/[.!?]$/.test(c.snippet) ? "" : "."} [${i + 1}]`).join(" ");
  return { kind: "answer", text, citations: used.map((c) => ({ id: c.sourceId, title: c.sourceTitle, snippet: c.snippet })) };
}
```

- [ ] **Step 5: Run, expect PASS.** `npx vitest run modules-custom/receipts/__tests__/answer.test.ts`
- [ ] **Step 6: Commit.** `git add modules-custom/receipts && git commit -m "feat(receipts): deterministic cited-answer + refusal + tests"`

> **OPTIONAL LLM garnish (skip unless spine is done and ARI's AI SDK is trivial):** in `answerFromSources`, after computing `used`, replace `text` with a Vercel AI SDK call constrained to the `used` snippets, instructed to cite `[n]` and to output the exact refusal string if unsupported. The receipt still hashes the final string, so verification is unaffected. **Never make the spine depend on this.**

### Task A4: consequence engine (TDD)

**Files:** Create `lib/consequence.ts`, `__tests__/consequence.test.ts`

- [ ] **Step 1: Failing test** — `__tests__/consequence.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { evaluateConsequence, issueToken, verifyToken } from "../lib/consequence";

describe("consequence engine", () => {
  it("acts on a safe create", () => {
    expect(evaluateConsequence({ toolName: "create_task", toolInput: { title: "x" }, userId: "u" }).decision).toBe("act");
  });
  it("drafts + escalates to typed when emailing many recipients", () => {
    const d = evaluateConsequence({ toolName: "draft_email", toolInput: { recipientCount: 15 }, userId: "u", affectedCount: 15 });
    expect(d.decision).toBe("draft"); expect(d.tier).toBe("typed"); expect(d.confirmationToken).toBeTruthy();
  });
  it("refuses an irreversible bulk delete over the ceiling", () => {
    expect(evaluateConsequence({ toolName: "delete_notes", toolInput: { count: 60 }, userId: "u", affectedCount: 60, irreversible: true }).decision).toBe("refuse");
  });
  it("round-trips a valid token, rejects a tampered one", () => {
    const t = issueToken({ inputHash: "h", toolName: "delete_notes", userId: "u", exp: Date.now() + 60000 });
    expect(verifyToken(t)?.userId).toBe("u");
    expect(verifyToken(t.slice(0, -2) + "xx")).toBeNull();
  });
});
```

- [ ] **Step 2: Run, expect FAIL.** `npx vitest run modules-custom/receipts/__tests__/consequence.test.ts`

- [ ] **Step 3: Implement `lib/consequence.ts`:**

```ts
import { createHmac } from "node:crypto";
import { canonicalJson, sha256Hex } from "./hash";

export type ConsequenceDecisionType = "act" | "draft" | "refuse";
export type ConfirmationTier = "none" | "one_tap" | "typed";
export type SideEffect = "create" | "update" | "delete" | "email" | "push" | "external";

export interface ConsequenceProfile {
  toolName: string; label: string; sideEffects: SideEffect[];
  defaultTier: ConfirmationTier; producesDraft: boolean;
  preview: (input: Record<string, unknown>) => string;
}

export const PROFILES: Record<string, ConsequenceProfile> = {
  create_task: { toolName: "create_task", label: "Create task", sideEffects: ["create"], defaultTier: "none", producesDraft: false, preview: (i) => `Create a task: "${String(i.title ?? "untitled")}".` },
  draft_email: { toolName: "draft_email", label: "Email the team", sideEffects: ["email"], defaultTier: "one_tap", producesDraft: true, preview: (i) => `Draft (not send) an email to ${Number(i.recipientCount ?? 1)} recipient(s).` },
  delete_notes: { toolName: "delete_notes", label: "Delete notes", sideEffects: ["delete"], defaultTier: "one_tap", producesDraft: false, preview: (i) => `Permanently delete ${Number(i.count ?? 1)} note(s). This cannot be undone.` },
};

function unknownProfile(toolName: string): ConsequenceProfile {
  return { toolName, label: toolName, sideEffects: ["external"], defaultTier: "typed", producesDraft: true, preview: () => `Unknown action "${toolName}" — treated as high-risk.` };
}

export interface ConsequenceContext {
  toolName: string; toolInput: Record<string, unknown>; userId: string;
  affectedCount?: number; irreversible?: boolean;
  writeToolsEnabled?: boolean; permissionAllowed?: boolean;
}
export interface ConsequenceDecision {
  decision: ConsequenceDecisionType; tier: ConfirmationTier; reason: string;
  preview: string; inputHash: string; confirmationToken?: string; profile: ConsequenceProfile;
}

const TIER_ORDER: ConfirmationTier[] = ["none", "one_tap", "typed"];
const escalate = (a: ConfirmationTier, b: ConfirmationTier) => TIER_ORDER[Math.max(TIER_ORDER.indexOf(a), TIER_ORDER.indexOf(b))];

const TOKEN_TTL_MS = 5 * 60 * 1000;
const secret = () => (process.env.RECEIPTS_HMAC_SECRET && process.env.RECEIPTS_HMAC_SECRET.length >= 16 ? process.env.RECEIPTS_HMAC_SECRET : "receipts-dev-only-do-not-ship-secret");
const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export interface TokenPayload { inputHash: string; toolName: string; userId: string; exp: number; }
export function issueToken(p: TokenPayload): string {
  const body = b64url(Buffer.from(JSON.stringify(p)));
  return `${body}.${b64url(createHmac("sha256", secret()).update(body).digest())}`;
}
export function verifyToken(token: string): TokenPayload | null {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const i = token.lastIndexOf("."); const body = token.slice(0, i), sig = token.slice(i + 1);
  if (sig !== b64url(createHmac("sha256", secret()).update(body).digest())) return null;
  try {
    const p = JSON.parse(Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as TokenPayload;
    return p.exp < Date.now() ? null : p;
  } catch { return null; }
}

export function evaluateConsequence(ctx: ConsequenceContext): ConsequenceDecision {
  const profile = PROFILES[ctx.toolName] ?? unknownProfile(ctx.toolName);
  const inputHash = sha256Hex(canonicalJson(ctx.toolInput));
  const preview = profile.preview(ctx.toolInput);
  const n = ctx.affectedCount ?? Number(ctx.toolInput.count ?? ctx.toolInput.recipientCount ?? 0);

  if (ctx.writeToolsEnabled === false || ctx.permissionAllowed === false)
    return { decision: "refuse", tier: "typed", reason: "Write actions are disabled for this assistant.", preview, inputHash, profile };

  if (profile.sideEffects.includes("delete") && n > 50)
    return { decision: "refuse", tier: "typed", reason: `Refusing to delete ${n} items at once — exceeds the safety ceiling (50). Narrow the selection.`, preview, inputHash, profile };

  let tier = profile.defaultTier;
  if (profile.sideEffects.includes("delete") && (ctx.irreversible ?? true)) tier = escalate(tier, "typed");
  if (n > 10) tier = escalate(tier, "typed");

  if (profile.producesDraft || tier !== "none") {
    const token = issueToken({ inputHash, toolName: ctx.toolName, userId: ctx.userId, exp: Date.now() + TOKEN_TTL_MS });
    return { decision: "draft", tier, reason: tier === "typed" ? "High blast radius — type the confirmation to proceed." : "Routine write — one-tap approval required.", preview, inputHash, confirmationToken: token, profile };
  }
  return { decision: "act", tier: "none", reason: "Safe action — no side effects requiring approval.", preview, inputHash, profile };
}
```

- [ ] **Step 4: Run, expect PASS.** `npx vitest run modules-custom/receipts/__tests__/consequence.test.ts`
- [ ] **Step 5: Run the FULL suite green:** `npx vitest run modules-custom/receipts` → all 3 files pass.
- [ ] **Step 6: Commit.** `git add modules-custom/receipts && git commit -m "feat(receipts): consequence engine + HMAC approval + tests"`

### Task A5: seed data (incl. the Vineyard depth-flex)

**File:** Create `lib/seed-data.ts`

- [ ] **Step 1: Write it:**

```ts
import type { Source } from "./retrieval";

export const SOURCES: Source[] = [
  { id: "note-roadmap",    title: "Q3 Roadmap",         text: "The Q3 roadmap prioritizes the billing rewrite and the mobile app beta. Billing migration starts in July and must finish before the September investor update." },
  { id: "note-standup",    title: "Standup 2026-05-20", text: "Maria is leading the billing rewrite. The mobile beta is blocked on the design review next week. We agreed to freeze new feature requests until the billing migration ships." },
  { id: "note-vendor",     title: "Vendor Contract",    text: "The Stripe contract renews annually on October 1. Early termination requires 60 days notice. Our plan caps at 100k monthly active customers." },
  { id: "note-onboarding", title: "Onboarding",         text: "New engineers get a laptop, GitHub access, and a buddy. The first task is always to ship a one-line change to production to validate the pipeline." },
  { id: "note-security",   title: "Security Policy",    text: "All production access requires hardware 2FA. Secrets live in the vault, never in env files committed to git. Audit logs are retained for 12 months." },
];

/** Origin-story receipt, pre-sealed at seq 0 — a refused organic-spray decision.
 *  Shows the engine's real escalation logic (organic + stale scan + weather). */
export const VINEYARD_DECISION = {
  prompt: "Should we spray Block A tomorrow and notify the field team?",
  decision: "refuse" as const,
  output: "Recommendation: do NOT auto-spray Block A. (1) Block A is certified organic — a spray order escalates to typed-confirmation, certification-risk tier. (2) The last disease scan is 9 days old (freshness check failed). (3) Forecast shows rain within 12h (drift/runoff risk). Safer plan: schedule a drone scan, create a scouting task for rows 4-6, and DRAFT (not send) a note to the field lead.",
  citationIds: ["block-a-organic-cert", "scan-log", "weather-feed"],
};
```

- [ ] **Step 2: Commit.** `git add modules-custom/receipts && git commit -m "feat(receipts): seed sources + vineyard origin-story receipt"`

> ✅ **Phase A done when:** `npx vitest run modules-custom/receipts` is fully green. The trust engine is proven before ARI is even involved.

---

## PHASE B — ARI integration (THE SPINE — this is the win)

### Task B1: database schema

**Files:** Create `database/schema.ts`, `database/uninstall.sql`

- [ ] **Step 1: `database/schema.ts`** (match the column/RLS style you saw in the template):

```ts
import { pgTable, text, integer, jsonb, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";

export const receiptsSources = pgTable("receipts_sources", {
  id: text("id").notNull(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.id] }),
}));

export const receiptsLedger = pgTable("receipts_ledger", {
  receiptHash: text("receipt_hash").primaryKey(),
  userId: uuid("user_id").notNull(),
  seq: integer("seq").notNull(),
  kind: text("kind").notNull(),
  prompt: text("prompt").notNull(),
  promptHash: text("prompt_hash").notNull(),
  output: text("output").notNull(),
  outputHash: text("output_hash").notNull(),
  citationIds: jsonb("citation_ids").$type<string[]>().notNull(),
  decision: text("decision"),
  prevHash: text("prev_hash").notNull(),
  createdAt: text("created_at").notNull(),
});
```

- [ ] **Step 2: `database/uninstall.sql`:**

```sql
DROP TABLE IF EXISTS receipts_ledger;
DROP TABLE IF EXISTS receipts_sources;
```

- [ ] **Step 3: Apply the migration** the way the template documents (e.g. `npm run db:migrate`, or ARI regenerates on build/restart). Confirm both tables exist (psql `\dt receipts_*` or the Supabase table view).
- [ ] **Step 4: Commit.** `git add modules-custom/receipts && git commit -m "feat(receipts): drizzle schema + uninstall"`

### Task B2: API routes — seed, ask, list, tamper

> All routes import DB+user ONLY from `../../lib/ari-adapter` and use Drizzle. Standard syntax below.

- [ ] **Step 1: `api/seed/route.ts`:**

```ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, getUserId } from "../../lib/ari-adapter";
import { receiptsSources, receiptsLedger } from "../../database/schema";
import { SOURCES, VINEYARD_DECISION } from "../../lib/seed-data";
import { buildContent, sealReceipt, toRow, GENESIS_HASH } from "../../lib/receipts";

export async function POST(req: NextRequest) {
  const db = getDb(); const userId = await getUserId(req);
  await db.delete(receiptsLedger).where(eq(receiptsLedger.userId, userId));
  await db.delete(receiptsSources).where(eq(receiptsSources.userId, userId));
  for (const s of SOURCES) await db.insert(receiptsSources).values({ id: s.id, userId, title: s.title, body: s.text });

  const r0 = sealReceipt(buildContent({ seq: 0, kind: "action", prompt: VINEYARD_DECISION.prompt, output: VINEYARD_DECISION.output, citation_ids: VINEYARD_DECISION.citationIds, decision: VINEYARD_DECISION.decision, created_at: new Date().toISOString() }), GENESIS_HASH);
  await db.insert(receiptsLedger).values(toRow(r0, userId));
  return NextResponse.json({ ok: true, seeded: SOURCES.length });
}
```

- [ ] **Step 2: `api/ask/route.ts`:**

```ts
import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { getDb, getUserId } from "../../lib/ari-adapter";
import { receiptsSources, receiptsLedger } from "../../database/schema";
import { answerFromSources } from "../../lib/answer";
import { buildContent, sealReceipt, toRow, GENESIS_HASH } from "../../lib/receipts";

const Body = z.object({ question: z.string().min(1) });

export async function POST(req: NextRequest) {
  const db = getDb(); const userId = await getUserId(req);
  const { question } = Body.parse(await req.json());

  const src = await db.select().from(receiptsSources).where(eq(receiptsSources.userId, userId));
  const result = answerFromSources(question, src.map((s) => ({ id: s.id, title: s.title, text: s.body })));

  const ledger = await db.select().from(receiptsLedger).where(eq(receiptsLedger.userId, userId)).orderBy(asc(receiptsLedger.seq));
  const seq = ledger.length;
  const prev = ledger.length ? ledger[ledger.length - 1].receiptHash : GENESIS_HASH;

  const sealed = sealReceipt(buildContent({ seq, kind: result.kind === "answer" ? "answer" : "refusal", prompt: question, output: result.text, citation_ids: result.citations.map((c) => c.id), created_at: new Date().toISOString() }), prev);
  await db.insert(receiptsLedger).values(toRow(sealed, userId));
  return NextResponse.json({ result, receipt: sealed });
}
```

- [ ] **Step 3: `api/list/route.ts`** (returns rows + verify status — powers both the ledger and the widget):

```ts
import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { getDb, getUserId } from "../../lib/ari-adapter";
import { receiptsLedger } from "../../database/schema";
import { fromRow, verifyChain } from "../../lib/receipts";

export async function GET(req: NextRequest) {
  const db = getDb(); const userId = await getUserId(req);
  const rows = await db.select().from(receiptsLedger).where(eq(receiptsLedger.userId, userId)).orderBy(asc(receiptsLedger.seq));
  const receipts = rows.map(fromRow);
  return NextResponse.json({ receipts, verify: verifyChain(receipts) });
}
```

- [ ] **Step 4: `api/tamper/route.ts`** (demo only — edits one stored output WITHOUT resealing, exactly like an attacker):

```ts
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, getUserId } from "../../lib/ari-adapter";
import { receiptsLedger } from "../../database/schema";

const Body = z.object({ seq: z.number().int().nonnegative().default(1) });

export async function POST(req: NextRequest) {
  const db = getDb(); const userId = await getUserId(req);
  const { seq } = Body.parse(await req.json().catch(() => ({})));
  const [row] = await db.select().from(receiptsLedger).where(and(eq(receiptsLedger.userId, userId), eq(receiptsLedger.seq, seq)));
  if (!row) return NextResponse.json({ ok: false, error: "no receipt at that seq" }, { status: 404 });
  await db.update(receiptsLedger).set({ output: row.output + " [SILENTLY EDITED]" }).where(eq(receiptsLedger.receiptHash, row.receiptHash));
  return NextResponse.json({ ok: true, tamperedSeq: seq });
}
```

- [ ] **Step 5: Smoke-test the API** (replace base path if Phase 0 found a different one). With ARI running:

```bash
B="http://localhost:3000/api/receipts"   # adjust port + base path to your build
curl -sX POST $B/seed | jq                                   # {ok:true, seeded:5}
curl -sX POST $B/ask -H 'Content-Type: application/json' -d '{"question":"Who is leading the billing rewrite?"}' | jq '.result.kind, .result.text'   # "answer", text with [1]
curl -sX POST $B/ask -H 'Content-Type: application/json' -d '{"question":"airspeed of an unladen swallow?"}' | jq '.result.kind'   # "refusal"
curl -s $B/list | jq '.verify'                               # {ok:true}
curl -sX POST $B/tamper -H 'Content-Type: application/json' -d '{"seq":1}' | jq   # {ok:true,tamperedSeq:1}
curl -s $B/list | jq '.verify'                               # {ok:false, brokenAtSeq:1, reason:"content hash mismatch..."}
```

> If any curl 404s, your module API base path differs — fix `lib/api-base.ts` and re-derive `$B`. If inserts error on `user_id`, see Troubleshooting → RLS.

- [ ] **Step 6: Commit.** `git add modules-custom/receipts && git commit -m "feat(receipts): seed/ask/list/tamper API routes"`

### Task B3: UI — Ask panel + Ledger (with the tamper→red money shot)

**Files:** Create `components/AskPanel.tsx`, `components/Ledger.tsx`, `app/page.tsx`

- [ ] **Step 1: `components/AskPanel.tsx`:**

```tsx
"use client";
import { useState } from "react";
import { API_BASE } from "../lib/api-base";

export function AskPanel({ onReceipt }: { onReceipt: () => void }) {
  const [q, setQ] = useState(""); const [res, setRes] = useState<any>(null); const [loading, setLoading] = useState(false);
  async function ask() {
    if (!q) return; setLoading(true);
    const r = await fetch(`${API_BASE}/ask`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) });
    setRes(await r.json()); setLoading(false); onReceipt();
  }
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex gap-2">
        <input className="flex-1 rounded-md border px-3 py-2 bg-transparent" placeholder="Ask your notes…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} />
        <button className="rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-50" onClick={ask} disabled={loading || !q}>Ask</button>
      </div>
      {res && (
        <div className={`rounded-md p-3 text-sm ${res.result.kind === "refusal" ? "bg-amber-50 text-amber-900 border border-amber-300" : "bg-neutral-50 border"}`}>
          <p className="whitespace-pre-wrap">{res.result.text}</p>
          {res.result.citations?.length > 0 && (
            <ol className="mt-2 list-decimal pl-5 text-xs text-neutral-600">
              {res.result.citations.map((c: any, i: number) => (<li key={i}><span className="font-medium">{c.title}</span>: {c.snippet}</li>))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `components/Ledger.tsx`** (renders each receipt; the broken one goes red):

```tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { API_BASE } from "../lib/api-base";

export function Ledger({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<{ receipts: any[]; verify: any } | null>(null);
  const load = useCallback(async () => { setData(await (await fetch(`${API_BASE}/list`)).json()); }, []);
  useEffect(() => { load(); }, [refreshKey, load]);

  const seed = async () => { await fetch(`${API_BASE}/seed`, { method: "POST" }); load(); };
  const tamper = async () => { await fetch(`${API_BASE}/tamper`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seq: 1 }) }); load(); };

  const verify = data?.verify; const broken = verify && !verify.ok ? verify.brokenAtSeq : -1;
  const kindColor: Record<string, string> = { answer: "text-emerald-700", refusal: "text-amber-700", action: "text-blue-700", trust: "text-purple-700" };

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">Receipts ledger</h3>
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${verify?.ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
          {verify ? (verify.ok ? "✓ Verified" : `✗ Broken at #${verify.brokenAtSeq}`) : "…"}
        </span>
      </div>
      {verify && !verify.ok && <p className="text-xs text-red-700">{verify.reason}</p>}
      <div className="flex gap-2">
        <button className="rounded-md border px-3 py-1 text-sm" onClick={seed}>Seed demo</button>
        <button className="rounded-md border px-3 py-1 text-sm" onClick={load}>Verify</button>
        <button className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700" onClick={tamper}>Tamper (demo)</button>
      </div>
      <ul className="divide-y text-sm">
        {data?.receipts.map((r) => (
          <li key={r.receipt_hash} className={`py-2 ${r.seq === broken ? "bg-red-50 -mx-2 px-2 rounded" : ""}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">#{r.seq}</span>
              <span className={`text-xs font-medium uppercase ${kindColor[r.kind] ?? ""}`}>{r.kind}{r.decision ? ` · ${r.decision}` : ""}</span>
              {r.seq === broken && <span className="text-xs font-bold text-red-700">TAMPERED</span>}
              <span className="ml-auto font-mono text-[10px] text-neutral-400">{r.receipt_hash.slice(0, 16)}…</span>
            </div>
            <p className="mt-0.5 text-neutral-700"><span className="font-medium">Prompt:</span> {r.prompt}</p>
            <p className="mt-0.5 text-neutral-600"><span className="font-medium">Receipt:</span> {r.output}</p>
            {r.citation_ids?.length > 0 && (
              <p className="mt-0.5 font-mono text-[10px] text-neutral-400">citations: {r.citation_ids.join(", ")}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: `app/page.tsx`:**

```tsx
"use client";
import { useState } from "react";
import { AskPanel } from "../components/AskPanel";
import { Ledger } from "../components/Ledger";

export default function ReceiptsPage() {
  const [k, setK] = useState(0);
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Receipts</h1>
        <p className="text-sm text-neutral-500">Every answer cites its sources. Every action needs consent. Every interaction is a tamper-evident receipt.</p>
      </header>
      <AskPanel onReceipt={() => setK((x) => x + 1)} />
      <Ledger refreshKey={k} />
    </div>
  );
}
```

- [ ] **Step 4: SPINE DEMO DRY-RUN.** Open `/receipts`: **Seed demo** → ask "Who is leading the billing rewrite?" (cited) → ask nonsense (refusal) → ledger shows receipts + green ✓ → **Tamper** → **Verify** → row #1 turns **red + "TAMPERED"**, badge red. Open #0 to mention the Vineyard story.
- [ ] **Step 5: Commit.** `git add modules-custom/receipts && git commit -m "feat(receipts): Ask + Ledger UI, tamper→red verifier (SPINE COMPLETE)"`

> 🟢 **If the clock is gone, STOP HERE and jump to Phase D. You have a winning demo.**

---

## PHASE C — Trust Architect + gated action (priority finish)

This phase ports the **full org-brain Cleo pattern** into ARI, adapted to module safety. Cleo is not just a form: it is a staged design consultant. It starts with a picker, proposes a stack, walks one layer at a time, shows diagrams, pauses with Continue controls, then produces a final written policy. For ARI, that final policy becomes a **module trust policy receipt**.

Why this matters to ARI: ARI's core promise is "build AI modules in minutes." Receipts makes those AI-built modules safe to trust by documenting the module's data access, action surface, approval rules, and refusal rules.

### Full org-brain Cleo replication contract (read before C0)

Build the full **Cleo interaction pattern**, not just a settings form:

- **Picker first:** like Cleo's `africai-pick`, begin with selectable chips for workflow, source types, and bottlenecks. Do not start with a blank form.
- **Stage machine:** walk through `Picker → Overview → Data layer → Action layer → Approval layer → Ledger layer → Benefits → Final policy`.
- **One stage at a time:** each click reveals one focused stage and a Continue button. Do not dump the full policy at once.
- **Diagrams:** render a simple diagram per stage: `stack`, `step`, `impact`, or `policy`. These are local React components, not Mermaid.
- **Controls:** every stage has two or three "ask" chips, plus one Continue button, mirroring Cleo's `africai-next`.
- **Mid-walkthrough answers:** if the user taps an ask chip, show a short answer and keep the same next stage available. Never lose place.
- **Final proposal:** the last stage produces a 1-page module operating policy, then seals it into the Receipts ledger as `kind: "trust"`, `decision: "draft"`.
- **Grounding:** use the local capability library below so the proposal is based on allowed ARI trust primitives, not vague AI promises.
- **Output shape:** the final policy must include `Module`, `Purpose`, `Data boundary`, `RAG policy`, `Action boundary`, `Approval policy`, `Refusal policy`, `Receipt policy`, and `Owner handoff`.
- **Default demo:** `Project Memory Copilot` reads `notes + documents`, can `answer questions + create task + archive note + delete notes`, and the policy must mark `delete notes` as refused or typed-approval/high-risk.
- **Judge line:** "This is the full Cleo design walkthrough rebuilt for ARI modules: it architects the module, then Receipts verifies the module."

Do **not** port org-brain's enterprise pricing, calendar booking, sovereign deployment sales copy, or AfricAI-specific claims. Translate the mechanism to ARI: module design, trust policy, approval boundaries, audit receipts.

### Cleo primitives for ARI

Use this exact capability library when generating stack layers:

```ts
export const CLEO_PRIMITIVES = [
  {
    id: "document_qa",
    name: "Document Q&A",
    role: "citation-first answers from ARI notes and documents",
    trustRule: "answer only when retrieved sources pass the grounding threshold; otherwise refuse",
  },
  {
    id: "drafting",
    name: "Drafting agent",
    role: "drafts notes, summaries, emails, or project updates from grounded context",
    trustRule: "drafts only; anything leaving ARI needs named approval",
  },
  {
    id: "sentinel",
    name: "Sentinel",
    role: "watches deadlines, stale notes, blocked tasks, or risky workflow states",
    trustRule: "alerts only; never silently changes user data",
  },
  {
    id: "memory",
    name: "Memory layer",
    role: "keeps project decisions and institutional context searchable",
    trustRule: "records source, timestamp, and reason for every memory update",
  },
  {
    id: "connector",
    name: "Custom connector",
    role: "lets the module propose actions in ARI tools",
    trustRule: "all writes pass through act/draft/refuse consequence gating",
  },
  {
    id: "named_signer",
    name: "Named-signer",
    role: "requires a human approval before risky action execution",
    trustRule: "approval tokens are scoped, hashed, and short-lived",
  },
  {
    id: "audit_grade",
    name: "Audit-grade ledger",
    role: "seals answers, refusals, policies, approvals, and actions",
    trustRule: "hash-chain verification flags tampering",
  },
] as const;
```

### Task C0: Full Cleo-style Trust Architect (module policy receipt)

**Files:** Create `lib/cleo.ts`, `api/trust/route.ts`, `components/CleoDiagram.tsx`, `components/TrustArchitect.tsx`; modify `app/page.tsx`

- [ ] **Step 1: `lib/cleo.ts`** — the full org-brain Cleo pattern as deterministic ARI module design logic:

```ts
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
```

- [ ] **Step 2: `api/trust/route.ts`** — deterministic final Cleo policy sealed as a `trust` receipt:

```ts
import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { getDb, getUserId } from "../../lib/ari-adapter";
import { receiptsLedger } from "../../database/schema";
import { buildContent, sealReceipt, toRow, GENESIS_HASH } from "../../lib/receipts";
import { buildFinalPolicy } from "../../lib/cleo";

const Body = z.object({
  moduleName: z.string().min(1).default("AI Workflow"),
  workflow: z.enum(["knowledge", "tasks", "email", "documents", "finance", "custom"]).default("knowledge"),
  reads: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
  bottlenecks: z.array(z.string()).default([]),
  owner: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const db = getDb(); const userId = await getUserId(req);
  const input = Body.parse(await req.json());
  const output = buildFinalPolicy(input);

  const ledger = await db.select().from(receiptsLedger).where(eq(receiptsLedger.userId, userId)).orderBy(asc(receiptsLedger.seq));
  const seq = ledger.length;
  const prev = ledger.length ? ledger[ledger.length - 1].receiptHash : GENESIS_HASH;
  const prompt = `Cleo trust review: ${input.moduleName} workflow=${input.workflow} reads=${input.reads.join("|")} actions=${input.actions.join("|")} bottlenecks=${input.bottlenecks.join("|")}`;
  const sealed = sealReceipt(buildContent({ seq, kind: "trust", prompt, output, citation_ids: [], decision: "draft", created_at: new Date().toISOString() }), prev);
  await db.insert(receiptsLedger).values(toRow(sealed, userId));

  return NextResponse.json({ policy: output, receipt: sealed });
}
```

- [ ] **Step 3: `components/CleoDiagram.tsx`** — tiny renderer for Cleo diagrams:

```tsx
"use client";

export function CleoDiagram({ diagram }: { diagram: any }) {
  if (!diagram) return null;
  if (diagram.kind === "stack") return (
    <div className="rounded-md border bg-neutral-50 p-3">
      <div className="mb-2 text-xs font-semibold uppercase text-neutral-500">{diagram.title}</div>
      <div className="grid gap-2">{diagram.layers.map((l: any) => (
        <div key={l.name} className="grid grid-cols-[120px_1fr] gap-2 rounded border bg-white p-2 text-xs">
          <span className="font-semibold">{l.name}</span><span>{l.role}</span>
        </div>
      ))}</div>
    </div>
  );
  if (diagram.kind === "impact") return (
    <div className="rounded-md border bg-neutral-50 p-3">
      <div className="mb-2 text-xs font-semibold uppercase text-neutral-500">{diagram.title}</div>
      <div className="grid gap-2 sm:grid-cols-2">{diagram.items.map((x: any) => (
        <div key={x.label} className="rounded border bg-white p-2 text-xs"><b>{x.label}</b>: {x.before} → {x.after}</div>
      ))}</div>
    </div>
  );
  if (diagram.kind === "policy") return (
    <div className="rounded-md border bg-purple-50 p-3 text-xs text-purple-950">
      <div className="font-semibold">{diagram.title}</div>
      <div className="mt-2 rounded border border-purple-200 bg-white px-3 py-2">Ready to seal as a {diagram.receiptKind} receipt.</div>
    </div>
  );
  return (
    <div className="rounded-md border bg-neutral-50 p-3 text-xs">
      <div className="font-semibold">{diagram.title}</div>
      <div className="mt-2 flex items-center gap-2">
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
```

- [ ] **Step 4: `components/TrustArchitect.tsx`** — full Cleo walkthrough:

```tsx
"use client";
import { useMemo, useState } from "react";
import { API_BASE } from "../lib/api-base";
import { CLEO_STAGES, answerAsk, buildFinalPolicy, diagramFor, type CleoStageId, type Workflow } from "../lib/cleo";
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

export function TrustArchitect({ onReceipt }: { onReceipt: () => void }) {
  const [moduleName, setModuleName] = useState("Project Memory Copilot");
  const [workflow, setWorkflow] = useState<Workflow>("knowledge");
  const [reads, setReads] = useState<string[]>(["notes", "documents"]);
  const [actions, setActions] = useState<string[]>(["answer questions", "create task", "archive note", "delete notes"]);
  const [bottlenecks, setBottlenecks] = useState<string[]>(["hallucinated answers", "unsafe writes", "editable audit history"]);
  const [stageId, setStageId] = useState<CleoStageId>("picker");
  const [askAnswer, setAskAnswer] = useState("");
  const [policy, setPolicy] = useState("");

  const input = useMemo(() => ({ moduleName, workflow, reads, actions, bottlenecks, owner: "ARI user" }), [moduleName, workflow, reads, actions, bottlenecks]);
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
    const finalPolicy = buildFinalPolicy(input);
    setPolicy(finalPolicy);
    const r = await fetch(`${API_BASE}/trust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await r.json();
    setPolicy(data.policy ?? finalPolicy);
    onReceipt();
  }

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <div>
        <h3 className="font-semibold">Cleo Trust Architect</h3>
        <p className="text-sm text-neutral-500">A staged Cleo walkthrough for ARI modules: design the stack, review each trust layer, then seal the policy.</p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {CLEO_STAGES.map((s) => (
          <button key={s.id} className={`rounded-full border px-3 py-1 ${s.id === stageId ? "bg-neutral-900 text-white" : "bg-white"}`} onClick={() => setStageId(s.id)}>
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
              <input className="mt-1 w-full rounded-md border bg-transparent px-3 py-2" value={moduleName} onChange={(e) => setModuleName(e.target.value)} />
            </label>
            <label className="text-sm">
              <span className="text-xs text-neutral-500">Workflow</span>
              <select className="mt-1 w-full rounded-md border bg-transparent px-3 py-2" value={workflow} onChange={(e) => setWorkflow(e.target.value as Workflow)}>
                {WORKFLOWS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-neutral-500">Can read</p>
            <div className="flex flex-wrap gap-2">{READS.map((x) => <button key={x} className={`rounded-full border px-3 py-1 text-xs ${reads.includes(x) ? "bg-emerald-50 border-emerald-300" : ""}`} onClick={() => toggle(x, reads, setReads)}>{x}</button>)}</div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-neutral-500">Can propose actions</p>
            <div className="flex flex-wrap gap-2">{ACTIONS.map((x) => <button key={x} className={`rounded-full border px-3 py-1 text-xs ${actions.includes(x) ? "bg-blue-50 border-blue-300" : ""}`} onClick={() => toggle(x, actions, setActions)}>{x}</button>)}</div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-neutral-500">Known risks</p>
            <div className="flex flex-wrap gap-2">{BOTTLENECKS.map((x) => <button key={x} className={`rounded-full border px-3 py-1 text-xs ${bottlenecks.includes(x) ? "bg-amber-50 border-amber-300" : ""}`} onClick={() => toggle(x, bottlenecks, setBottlenecks)}>{x}</button>)}</div>
          </div>
        </div>
      )}

      {stageId !== "picker" && <CleoDiagram diagram={diagram} />}

      {stage.asks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stage.asks.map((q) => <button key={q} className="rounded-md border px-3 py-1 text-xs" onClick={() => setAskAnswer(answerAsk(q))}>{q}</button>)}
        </div>
      )}
      {askAnswer && <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700">{askAnswer}</div>}

      <div className="flex gap-2">
        {stage.next && <button className="rounded-md bg-neutral-900 px-4 py-2 text-white" onClick={next}>Continue: {CLEO_STAGES.find((s) => s.id === stage.next)?.title}</button>}
        {stageId === "final" && <button className="rounded-md bg-purple-700 px-4 py-2 text-white" onClick={seal}>Seal trust receipt</button>}
      </div>

      {stageId === "final" && <pre className="whitespace-pre-wrap rounded-md border bg-neutral-50 p-3 text-xs text-neutral-800">{policy || buildFinalPolicy(input)}</pre>}
    </div>
  );
}
```

- [ ] **Step 5: Wire into `app/page.tsx`** — after C0, the page should be Ask → Trust Architect → Ledger:

```tsx
"use client";
import { useState } from "react";
import { AskPanel } from "../components/AskPanel";
import { TrustArchitect } from "../components/TrustArchitect";
import { Ledger } from "../components/Ledger";

export default function ReceiptsPage() {
  const [k, setK] = useState(0);
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Receipts</h1>
        <p className="text-sm text-neutral-500">Design the trust policy, then verify every answer, action, and receipt.</p>
      </header>
      <AskPanel onReceipt={() => setK((x) => x + 1)} />
      <TrustArchitect onReceipt={() => setK((x) => x + 1)} />
      <Ledger refreshKey={k} />
    </div>
  );
}
```
- [ ] **Step 6: Demo check.** Walk through every Cleo stage for "Project Memory Copilot"; Final → **Seal trust receipt**; ledger adds a `trust · draft` receipt; Verify stays green.
- [ ] **Step 7: Commit.** `git add modules-custom/receipts && git commit -m "feat(receipts): full Cleo-style trust architect for ARI module policies"`

### Task C1: action route

**File:** Create `api/action/route.ts`

- [ ] **Step 1: Write it** (POST evaluates; PUT approves the token and seals an action receipt):

```ts
import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { getDb, getUserId } from "../../lib/ari-adapter";
import { receiptsLedger } from "../../database/schema";
import { evaluateConsequence, verifyToken } from "../../lib/consequence";
import { buildContent, sealReceipt, toRow, GENESIS_HASH } from "../../lib/receipts";
import { canonicalJson, sha256Hex } from "../../lib/hash";

const Propose = z.object({ toolName: z.string(), toolInput: z.record(z.string(), z.any()).default({}), affectedCount: z.number().optional(), irreversible: z.boolean().optional() });
const Approve = z.object({ toolName: z.string(), toolInput: z.record(z.string(), z.any()).default({}), token: z.string() });

export async function POST(req: NextRequest) {
  const db = getDb(); const userId = await getUserId(req);
  const b = Propose.parse(await req.json());
  const decision = evaluateConsequence({ ...b, userId });

  // Immediate decisions still leave receipts. Drafts are sealed only if/when
  // the user approves them in PUT, so the ledger doesn't double-count.
  if (decision.decision === "act" || decision.decision === "refuse") {
    const ledger = await db.select().from(receiptsLedger).where(eq(receiptsLedger.userId, userId)).orderBy(asc(receiptsLedger.seq));
    const seq = ledger.length;
    const prev = ledger.length ? ledger[ledger.length - 1].receiptHash : GENESIS_HASH;
    const output = decision.decision === "act"
      ? `Executed: ${b.toolName}. ${decision.preview}`
      : `Refused: ${b.toolName}. ${decision.reason}`;
    const sealed = sealReceipt(buildContent({ seq, kind: "action", prompt: `${b.toolName} ${JSON.stringify(b.toolInput)}`, output, citation_ids: [], decision: decision.decision, created_at: new Date().toISOString() }), prev);
    await db.insert(receiptsLedger).values(toRow(sealed, userId));
    return NextResponse.json({ ...decision, receipt: sealed });
  }

  return NextResponse.json(decision);
}

export async function PUT(req: NextRequest) {
  const db = getDb(); const userId = await getUserId(req);
  const b = Approve.parse(await req.json());
  const payload = verifyToken(b.token);
  const inputHash = sha256Hex(canonicalJson(b.toolInput));
  if (!payload || payload.userId !== userId || payload.toolName !== b.toolName || payload.inputHash !== inputHash)
    return NextResponse.json({ ok: false, error: "invalid or expired approval token" }, { status: 400 });

  const ledger = await db.select().from(receiptsLedger).where(eq(receiptsLedger.userId, userId)).orderBy(asc(receiptsLedger.seq));
  const seq = ledger.length;
  const prev = ledger.length ? ledger[ledger.length - 1].receiptHash : GENESIS_HASH;
  const sealed = sealReceipt(buildContent({ seq, kind: "action", prompt: `${b.toolName} ${JSON.stringify(b.toolInput)}`, output: `Approved & executed: ${b.toolName}`, citation_ids: [], decision: "act", created_at: new Date().toISOString() }), prev);
  await db.insert(receiptsLedger).values(toRow(sealed, userId));
  return NextResponse.json({ ok: true, receipt: sealed });
}
```

- [ ] **Step 2: Smoke-test:**

```bash
curl -sX POST $B/action -H 'Content-Type: application/json' -d '{"toolName":"create_task","toolInput":{"title":"x"}}' | jq '.decision'   # "act"
curl -sX POST $B/action -H 'Content-Type: application/json' -d '{"toolName":"delete_notes","toolInput":{"count":60},"affectedCount":60,"irreversible":true}' | jq '.decision'   # "refuse"
```

- [ ] **Step 3: Commit.** `git add modules-custom/receipts && git commit -m "feat(receipts): gated-action route (propose/approve)"`

### Task C2: Decision cards UI

**Files:** Create `components/DecisionCards.tsx`; modify `app/page.tsx`

- [ ] **Step 1: `components/DecisionCards.tsx`** (hard-coded color map so Tailwind never purges it):

```tsx
"use client";
import { useState } from "react";
import { API_BASE } from "../lib/api-base";

const DEMOS = [
  { label: "Create a task", body: { toolName: "create_task", toolInput: { title: "Review billing migration" } } },
  { label: "Email 15 teammates", body: { toolName: "draft_email", toolInput: { recipientCount: 15 }, affectedCount: 15 } },
  { label: "Delete 23 notes", body: { toolName: "delete_notes", toolInput: { count: 23 }, affectedCount: 23, irreversible: true } },
  { label: "Delete 60 notes", body: { toolName: "delete_notes", toolInput: { count: 60 }, affectedCount: 60, irreversible: true } },
];
const BOX: Record<string, string> = {
  act: "bg-emerald-50 border-emerald-300 text-emerald-900",
  draft: "bg-amber-50 border-amber-300 text-amber-900",
  refuse: "bg-red-50 border-red-300 text-red-900",
};

export function DecisionCards({ onChange }: { onChange: () => void }) {
  const [d, setD] = useState<any>(null);
  async function propose(body: any) {
    const r = await fetch(`${API_BASE}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const next = { ...(await r.json()), _body: body };
    setD(next);
    if (next.receipt) onChange();
  }
  async function approve() {
    const r = await fetch(`${API_BASE}/action`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolName: d._body.toolName, toolInput: d._body.toolInput, token: d.confirmationToken }) });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "approval failed" }));
      setD({ ...d, decision: "refuse", reason: err.error ?? "approval failed" });
      return;
    }
    setD(null); onChange();
  }
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <h3 className="font-semibold">Ask the assistant to act</h3>
      <div className="flex flex-wrap gap-2">
        {DEMOS.map((x) => (<button key={x.label} className="rounded-md border px-3 py-1 text-sm" onClick={() => propose(x.body)}>{x.label}</button>))}
      </div>
      {d && (
        <div className={`rounded-md border p-3 text-sm ${BOX[d.decision] ?? "bg-neutral-50 border"}`}>
          <div className="text-xs font-bold uppercase tracking-wide">{d.decision} · tier: {d.tier}</div>
          <p className="mt-1">{d.preview}</p>
          <p className="mt-1 opacity-80">{d.reason}</p>
          {d.decision === "draft" && <button className="mt-2 rounded-md bg-amber-600 px-3 py-1 text-white" onClick={approve}>Approve &amp; seal receipt</button>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into `app/page.tsx`** — after C2, the final combined page should be Ask → Trust Architect → Decision Cards → Ledger:

```tsx
"use client";
import { useState } from "react";
import { AskPanel } from "../components/AskPanel";
import { TrustArchitect } from "../components/TrustArchitect";
import { DecisionCards } from "../components/DecisionCards";
import { Ledger } from "../components/Ledger";

export default function ReceiptsPage() {
  const [k, setK] = useState(0);
  const bump = () => setK((x) => x + 1);
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Receipts</h1>
        <p className="text-sm text-neutral-500">Design the trust policy, then verify every answer, action, and receipt.</p>
      </header>
      <AskPanel onReceipt={bump} />
      <TrustArchitect onReceipt={bump} />
      <DecisionCards onChange={bump} />
      <Ledger refreshKey={k} />
    </div>
  );
}
```
- [ ] **Step 3: Demo check.** Buttons yield act / draft(typed) / draft(typed) / refuse. Approving a draft adds an `action` receipt; Verify stays green.
- [ ] **Step 4: Commit.** `git add modules-custom/receipts && git commit -m "feat(receipts): consequence cards UI (act/draft/refuse + approval)"`

---

## PHASE D — Polish + submit (required to win)

### Task D1: dashboard widget

**File:** Create `components/DashboardWidget.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api-base";

export function DashboardWidget() {
  const [v, setV] = useState<any>(null);
  useEffect(() => { fetch(`${API_BASE}/list`).then((r) => r.json()).then((d) => setV(d.verify)); }, []);
  return (
    <a href="/receipts" className="block rounded-xl border p-4">
      <div className="text-sm font-semibold">Receipts</div>
      <div className={`mt-1 text-2xl font-bold ${v?.ok ? "text-emerald-600" : "text-red-600"}`}>{v ? (v.ok ? "✓ All verified" : `✗ Broken #${v.brokenAtSeq}`) : "…"}</div>
      <div className="mt-1 text-xs text-neutral-500">Trust policies · cited answers · tamper-evident</div>
    </a>
  );
}
```

- [ ] Confirm the widget shows on ARI's dashboard (module.json already declares `dashboard.widget.component = "DashboardWidget"`). Commit.

### Task D2: README + disclosure + license

**Files:** Create `README.md`, `LICENSE`

- [ ] **`README.md`:**

```md
# Receipts — a verifiable trust layer for ARI's AI

Receipts is a Trust Studio for ARI modules. It ports the full org-brain Cleo walkthrough
pattern into ARI: picker, stack overview, one trust layer at a time, diagrams, Continue
controls, and a final module policy receipt. Then it makes ARI's AI verifiable: every
answer is grounded in cited sources or refused, every risky action is gated by a consequence
preview + approval, and every interaction is sealed into a hash-chained, tamper-evident ledger.

## Demo
Open `/receipts` → **Seed demo** → ask "Who is leading the billing rewrite?" (cited answer) →
ask something off-corpus (refusal) → walk **Cleo Trust Architect** from picker to final
policy for "Project Memory Copilot" → seal the trust receipt → try the action buttons (act / draft / refuse) → **Verify** (green) →
**Tamper** → **Verify** (red, flags the altered receipt).
The pre-seeded "Vineyard Block A" receipt (#0) shows a refused organic-spray decision.

## How it works
- A full Cleo-style Trust Architect walks a user through module intent, stack layers, data boundary, action boundary, approval policy, ledger policy, and final receipt sealing.
- Deterministic RAG-style keyword retrieval over your sources; answers cite `[n]` or refuse below a grounding threshold.
- A consequence engine classifies actions `act` / `draft` / `refuse`, escalates by blast radius, and issues 5-minute HMAC approval tokens.
- Each interaction is sealed into a SHA-256 hash chain (`prev_hash` + canonical content). `verifyChain` recomputes the whole chain and flags any tampered entry.

## Disclosure (per ARI.HACK rules)
The consequence-engine, citation-first architect, and hash-chained-ledger patterns are
**adapted from the authors' production systems** (a farm-operations action-guardrail engine,
a citation-first institutional AI architect, and a carbon-MRV audit-anchor ledger). The ARI
module integration, cited-answer/refusal flow, verifier, Trust Architect, gated-action route,
and all UI were built during ARI.HACK.
MIT licensed; fully open source.

## License
MIT
```

- [ ] Add a standard **MIT `LICENSE`** (year 2026). Commit.

### Task D3: submit

- [ ] **Full 90s demo run** end-to-end; rehearse the script once.
- [ ] **Push to a public GitHub repo** (rules require open source): `git push -u origin main`.
- [ ] **Submission text** = README intro + the pitch line. Include the public repo URL + module purpose statement.
- [ ] **(Optional) 60–90s screen recording** of the demo.

---

## ✅ Acceptance checklist (you are done when ALL true)

- [ ] `npx vitest run modules-custom/receipts` → all green (3 test files).
- [ ] `/receipts` renders; module appears in ARI sidebar; widget on dashboard.
- [ ] Seed → grounded question returns a **cited** answer with `[1]`.
- [ ] Off-corpus question **refuses**.
- [ ] Cleo Trust Architect walks through staged design and seals a **module policy receipt** (`trust · draft`) for "Project Memory Copilot". *(Phase C0)*
- [ ] Action buttons show **act / draft / refuse**; "delete 60" refuses. *(Phase C)*
- [ ] Ledger lists receipts; **Verify** green; **Tamper** → **Verify** red + row flagged.
- [ ] Vineyard receipt (#0) present.
- [ ] README has the **disclosure**; repo is **public + MIT**.

---

## 🛠 Troubleshooting (most likely failures first)

| Symptom | Fix |
|---|---|
| **Module not in sidebar** | Registry scans on build/restart. Restart ARI dev server. Verify `module.json` `id:"receipts"` and the folder is under `modules-custom/`. |
| **API calls 404** | Your module API base path differs from `/api/receipts`. Re-check Phase 0 recon; set `lib/api-base.ts` to the real convention; all components + curls use it. |
| **Insert fails on `user_id` / RLS denies** | Either wire the real authenticated uid in `ari-adapter.getUserId`, OR for the local demo disable RLS on the two tables: `ALTER TABLE receipts_sources DISABLE ROW LEVEL SECURITY; ALTER TABLE receipts_ledger DISABLE ROW LEVEL SECURITY;` (note this in README as demo-only). |
| **`@/lib/db` import not found** in `ari-adapter` | That import was a placeholder — use the db client path recon found in the template. |
| **Tamper doesn't turn red** | The tamper route edits `seq:1`. Make sure at least one ask happened after seed (seq 0 is the vineyard receipt; seq 1 is your first ask). Tamper a seq that exists. |
| **Tailwind colors missing in prod build** | Decision cards already use a hard-coded `BOX` map. If other dynamic classes vanish, hard-code them too. Dev mode (`npm run dev`) won't purge — demo in dev. |
| **vitest not found** | Check `package.json` for the test runner ARI ships; run via its script. Don't add a new dep if avoidable. |
| **Grounded question still refuses** | Lower `MIN_SCORE` in `lib/answer.ts` (e.g. 0.34 → 0.25) or use the exact demo questions in the README, which are tuned to the seed corpus. |

---

## Why this wins (keep in mind while building)
- **Usefulness:** fixes the #1 reason people distrust AI assistants and AI-built modules — directly upgrades ARI's core.
- **Creativity:** a Trust Studio for AI modules; nobody hand-rolls policy receipts + citation + consequence + audit in a hackathon.
- **Execution:** the trust logic is pure, tested, and proven in isolation before integration.
- **Integration:** native ARI module — `modules-custom/`, Drizzle schema, API routes, dashboard widget, and a workflow designed around ARI's module-builder story.
- **Design:** a clean "ledger" aesthetic; the green→red tamper moment is unforgettable.
