# Receipts — ARI Module Build Plan (ARI.HACK handoff, execution-ready)

> **YOU ARE THE BUILDING AGENT (Claude Code at ARI.HACK).** This file contains *everything* you need. You do NOT have the authors' other repos — all load-bearing code is embedded here, complete. Your machine HAS ARI.Software installed (the event requires it). Build top-to-bottom. Checkboxes (`- [ ]`) track progress.

---

## ⚡ QUICK START (do this first, literally)

```bash
# 1. Confirm where ARI lives and that custom modules go here:
ls modules-custom/ 2>/dev/null && echo "FOUND modules-custom" || echo "find the ARI repo root first (look for modules-core/ and modules-custom/)"

# 2. Make the module folder
mkdir -p modules-custom/receipts/{app,api,components,hooks,lib,database,__tests__}

# 3. Do PHASE 0 recon (below) — fills in the ONLY ARI-specific unknowns
# 4. Do PHASE A — build + test the pure core in isolation (no ARI runtime needed)
# 5. Do PHASE B — wire into ARI; demo the spine
# 6. PHASE C stretch, PHASE D submit
```

**Golden rules (do not violate):**
1. **Determinism over cleverness.** The demo must never depend on a live LLM call. (LLM is an optional garnish in Phase A, clearly marked.)
2. **All ARI coupling lives in 2 files** (`lib/ari-adapter.ts`, `lib/api-base.ts`). Fill them once in Phase 0. Never scatter ARI-specific imports elsewhere.
3. **Honour the Cut Line.** Phase A + B = the winning demo. Do NOT start Phase C until the spine demos cleanly.
4. **Don't add npm dependencies.** ARI already ships `drizzle-orm`, `zod`, `vitest`, React, Next, Tailwind. `crypto` is built into Node. If a tool is missing, note it and continue.
5. **Commit after every task.** Small commits.
6. **YAGNI.** Build exactly what's below. No extra features.

---

## What you're building (1 minute)

`Receipts` — a custom ARI module that makes ARI's AI **verifiable**:
- **Grounded:** answers are built from cited sources, or **refused** if not grounded (no hallucination).
- **Gated:** consequential actions are classified `act` / `draft` / `refuse` and need approval (HMAC token).
- **Verifiable:** every interaction is sealed into a **hash-chained, tamper-evident ledger** with a one-click verifier.

**Judges score:** Usefulness · Creativity · Execution · Integration (fits ARI) · Design. This hits all five.

**The pitch (say to judges):**
> "Most AI assistants just answer. Receipts makes ARI's AI *verifiable* — every answer has sources, every risky action needs consent, and every interaction leaves a tamper-evident receipt you can independently check."

**The 90-second demo you are building toward:**
1. Ask a seeded question → cited answer with `[1][2]`.
2. Ask something off-corpus → **refusal**.
3. Click the action buttons → consequence cards show **act / draft / refuse**; "delete 60 notes" is **refused** (safety ceiling).
4. Open the ledger → every interaction is a receipt.
5. **Verify** → all green ✓. **Tamper** (silently edits one receipt) → **Verify** → chain breaks, the altered row turns **red**.
6. Open the pre-seeded **"Vineyard Block A"** receipt → a *refused* organic-spray decision (origin-story closer).

---

## 🎯 CUT LINE (when time is short)

| Phase | Tasks | Status target |
|---|---|---|
| **0 — Recon** | fill 2 coupling files | 5 min, do first |
| **A — Pure core (tested, no ARI)** | hash, receipts, retrieval, answer, consequence + tests all green | the foundation |
| **B — ARI integration (THE SPINE — ship no matter what)** | schema, seed, ask, list, tamper routes + Ask/Ledger UI + the **tamper→red** demo | **this wins** |
| **C — Stretch** | gated-action route + consequence cards | completes the story |
| **D — Polish + submit** | widget, README/disclosure, public repo, video | required to submit |

**Time budget (3h):** Phase 0+A 60m · B 75m · C 30m · D 20m. If you reach 6:00 PM, freeze Phase C and do D.

---

## PHASE 0 — Recon: fill the only ARI-specific unknowns (5 min)

There are exactly **four** things this plan can't know about your specific ARI build. Find them now, write them into two files, and the rest of the plan just works.

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

- [ ] **Step 2: Create `modules-custom/receipts/lib/api-base.ts`** (client-safe; the ONE place the API path is defined):

```ts
// PHASE 0: set this to your ARI build's module API convention.
// Most ARI modules expose routes at /api/<moduleId>/<route>. If recon shows a
// different convention (e.g. /modules/receipts/api), change ONLY this line.
export const API_BASE = "/api/receipts";
```

- [ ] **Step 3: Create `modules-custom/receipts/lib/ari-adapter.ts`** (server-only; the ONE place ARI's DB + auth are wired). Replace the two marked lines with what recon found:

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

- [ ] **Step 4: Confirm vitest runs.** `npx vitest --version` → if it errors, the project may use a different runner; check `package.json` `scripts.test`. You'll run pure-core tests in Phase A.

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

export type ReceiptKind = "answer" | "refusal" | "action";
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
  };
}

/** Map a DB row back to a Receipt. Defined ONCE here. */
export function fromRow(row: any): Receipt {
  return {
    seq: row.seq, kind: row.kind, prompt: row.prompt, prompt_hash: row.promptHash,
    output: row.output, output_hash: row.outputHash, citation_ids: row.citationIds ?? [],
    decision: row.decision ?? null,
    created_at: row.createdAt?.toISOString?.() ?? String(row.createdAt ?? ""),
    prev_hash: row.prevHash, receipt_hash: row.receiptHash,
  };
}
```

- [ ] **Step 4: Run, expect PASS.** `npx vitest run modules-custom/receipts/__tests__/receipts.test.ts`
- [ ] **Step 5: Commit.** `git commit -am "feat(receipts): tamper-evident hash-chained ledger + tests"`

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
- [ ] **Step 6: Commit.** `git commit -am "feat(receipts): deterministic cited-answer + refusal + tests"`

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
- [ ] **Step 6: Commit.** `git commit -am "feat(receipts): consequence engine + HMAC approval + tests"`

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

- [ ] **Step 2: Commit.** `git commit -am "feat(receipts): seed sources + vineyard origin-story receipt"`

> ✅ **Phase A done when:** `npx vitest run modules-custom/receipts` is fully green. The trust engine is proven before ARI is even involved.

---

## PHASE B — ARI integration (THE SPINE — this is the win)

### Task B1: database schema

**Files:** Create `database/schema.ts`, `database/uninstall.sql`

- [ ] **Step 1: `database/schema.ts`** (match the column/RLS style you saw in the template):

```ts
import { pgTable, text, integer, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";

export const receiptsSources = pgTable("receipts_sources", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: `database/uninstall.sql`:**

```sql
DROP TABLE IF EXISTS receipts_ledger;
DROP TABLE IF EXISTS receipts_sources;
```

- [ ] **Step 3: Apply the migration** the way the template documents (e.g. `npm run db:migrate`, or ARI regenerates on build/restart). Confirm both tables exist (psql `\dt receipts_*` or the Supabase table view).
- [ ] **Step 4: Commit.** `git commit -am "feat(receipts): drizzle schema + uninstall"`

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

- [ ] **Step 6: Commit.** `git commit -am "feat(receipts): seed/ask/list/tamper API routes"`

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
  const kindColor: Record<string, string> = { answer: "text-emerald-700", refusal: "text-amber-700", action: "text-blue-700" };

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
            <p className="mt-0.5 truncate text-neutral-700">{r.prompt}</p>
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
- [ ] **Step 5: Commit.** `git commit -am "feat(receipts): Ask + Ledger UI, tamper→red verifier (SPINE COMPLETE)"`

> 🟢 **If the clock is gone, STOP HERE and jump to Phase D. You have a winning demo.**

---

## PHASE C — Gated action (STRETCH; completes the story)

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

const Propose = z.object({ toolName: z.string(), toolInput: z.record(z.any()).default({}), affectedCount: z.number().optional(), irreversible: z.boolean().optional() });
const Approve = z.object({ toolName: z.string(), toolInput: z.record(z.any()).default({}), token: z.string() });

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  const b = Propose.parse(await req.json());
  return NextResponse.json(evaluateConsequence({ ...b, userId }));
}

export async function PUT(req: NextRequest) {
  const db = getDb(); const userId = await getUserId(req);
  const b = Approve.parse(await req.json());
  const payload = verifyToken(b.token);
  if (!payload || payload.userId !== userId || payload.toolName !== b.toolName)
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

- [ ] **Step 3: Commit.** `git commit -am "feat(receipts): gated-action route (propose/approve)"`

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
    setD({ ...(await r.json()), _body: body });
  }
  async function approve() {
    await fetch(`${API_BASE}/action`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolName: d._body.toolName, toolInput: d._body.toolInput, token: d.confirmationToken }) });
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

- [ ] **Step 2: Wire into `app/page.tsx`** — add the import and place `<DecisionCards onChange={() => setK((x) => x + 1)} />` between `<AskPanel/>` and `<Ledger/>`.
- [ ] **Step 3: Demo check.** Buttons yield act / draft(typed) / draft(typed) / refuse. Approving a draft adds an `action` receipt; Verify stays green.
- [ ] **Step 4: Commit.** `git commit -am "feat(receipts): consequence cards UI (act/draft/refuse + approval)"`

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
      <div className="mt-1 text-xs text-neutral-500">Cited answers · gated actions · tamper-evident</div>
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

Receipts makes ARI's AI verifiable: every answer is grounded in cited sources or refused,
every risky action is gated by a consequence preview + approval, and every interaction is
sealed into a hash-chained, tamper-evident ledger you can independently verify.

## Demo
Open `/receipts` → **Seed demo** → ask "Who is leading the billing rewrite?" (cited answer) →
ask something off-corpus (refusal) → try the action buttons (act / draft / refuse) →
**Verify** (green) → **Tamper** → **Verify** (red, flags the altered receipt).
The pre-seeded "Vineyard Block A" receipt (#0) shows a refused organic-spray decision.

## How it works
- Deterministic keyword retrieval over your sources; answers cite `[n]` or refuse below a grounding threshold.
- A consequence engine classifies actions `act` / `draft` / `refuse`, escalates by blast radius, and issues 5-minute HMAC approval tokens.
- Each interaction is sealed into a SHA-256 hash chain (`prev_hash` + canonical content). `verifyChain` recomputes the whole chain and flags any tampered entry.

## Disclosure (per ARI.HACK rules)
The consequence-engine pattern and hash-chained-ledger pattern are **adapted from the authors'
production systems** (a farm-operations action-guardrail engine and a carbon-MRV audit-anchor
ledger). The ARI module integration, cited-answer/refusal flow, verifier, gated-action route,
and all UI were built during ARI.HACK. MIT licensed; fully open source.

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
- **Usefulness:** fixes the #1 reason people distrust AI assistants — directly upgrades ARI's core.
- **Creativity:** a verify-the-AI trust layer; nobody hand-rolls citation + consequence + audit in a hackathon.
- **Execution:** the trust logic is pure, tested, and proven in isolation before integration.
- **Integration:** native ARI module — `modules-custom/`, Drizzle schema, API routes, dashboard widget.
- **Design:** a clean "ledger" aesthetic; the green→red tamper moment is unforgettable.
