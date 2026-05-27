# ARIA — Trust Studio for ARI

> **ARI lets anyone build AI modules. ARIA makes those modules safe to trust.**

ARIA is a custom ARI module that gives every ARI module a trust contract. It scans modules for risk, walks the builder through a Cleo-grade trust architecture, enforces grounded answers and gated actions, and proves every interaction with a tamper-evident hash-chained receipt ledger.

---

## 90-second review path

```
1. npm install && npm run dev
2. Open http://localhost:3000/aria
3. Click "Seed demo"
4. Click preset "Project Memory Copilot" → Scan module  (CRITICAL risk badge appears)
5. Click "Send to Trust Architect" → walk 8 stages → click "Seal trust receipt"
6. Click "Simulate policy" → try "Delete 60 notes" → see refuse
7. Ask "Who is leading the billing rewrite?" → cited answer with [1][2]
8. Ask "What is our Mars launch budget?" → refusal (no hallucination)
9. Click Verify → green ✓
10. Click Tamper → Verify → red ✗ with broken row flagged
```

---

## What it does

### 1. ARI Module Risk Scanner
Paste any ARI `module.json`. ARIA reads permissions, routes, and settings and computes a **risk score** (low / medium / high / **critical**).

```
Project Memory Copilot
Risk: CRITICAL  (score: 16)
· Database read/write access
· Exposes API routes
· Destructive action detected (delete/destroy/purge)
· Export capability detected
· Configurable settings

Reads: notes, tasks, documents
Can: answer questions, delete notes, export document
```

Detected defaults are wired directly into the Trust Architect — no re-entry needed.

### 2. Cleo Trust Architect
An 8-stage interactive walkthrough for designing a module trust contract:

```
Picker → Overview → Data layer → Action layer →
Approval layer → Ledger layer → Benefits → Final policy
```

Each stage explains one trust primitive, shows a local diagram, and offers ask chips. The final stage produces a complete operating policy and seals it into the ledger as a `trust` receipt.

### 3. Policy Simulator
Given the scanned module and its policy, simulate how ARIA responds to real requests **before trusting the module**:

| Request | Decision |
|---|---|
| Summarize notes | ✓ Act — cited answer |
| Create a task | ✓ Act |
| Archive 3 notes | ⏸ Draft · one-tap |
| Email 15 teammates | ⏸ Draft · typed |
| Delete 3 notes | ⏸ Draft · typed |
| Delete 60 notes | ✗ Refuse — safety ceiling |
| Ask unknown fact | ✗ Refuse — no grounding |

The policy is not decorative. It is executable.

### 4. Cited answers & refusals
Deterministic keyword retrieval over seeded notes. Answers cite `[n]` markers. Queries below the grounding threshold are refused — no hallucination. No external AI calls required.

### 5. Gated actions (consequence engine)
Classifies every action `act / draft / refuse`:
- **act** — safe, no side effects
- **draft · one-tap** — external or write side effects
- **draft · typed** — high blast radius, irreversible
- **refuse** — bulk deletes > 50, or policy ceiling

Drafts issue 5-minute HMAC approval tokens. Nothing executes without a signed token.

### 6. Tamper-evident receipt ledger
Every answer, refusal, action, and trust policy is sealed into a hash-chained ledger:

```
receipt_hash = SHA-256( canonicalJSON({ ...content, prev_hash }) )
```

`verifyChain` recomputes the entire chain. Any edit, removal, or reorder breaks the chain and pinpoints the exact row. The `created_at` timestamp is stored as the original ISO-8601 string — no lossy Date conversion — so the hash is stable across DB roundtrips.

---

## Trust Wrapper (copy into any ARI module)

```ts
import { evaluateConsequence } from "@/modules-custom/receipts/lib/consequence";

const decision = evaluateConsequence({
  toolName: "delete_notes",   // or "draft_email", "export_document", etc.
  toolInput,
  userId,
  affectedCount: toolInput.count,
  irreversible: true,
});

if (decision.decision === "refuse")
  return NextResponse.json({ error: decision.reason }, { status: 403 });

if (decision.decision === "draft")
  return NextResponse.json(
    { token: decision.confirmationToken, preview: decision.preview },
    { status: 202 }
  );

// safe to proceed
```

ARIA is not just a dashboard. It gives module builders the guardrail code to adopt.

---

## Setup

```bash
cp .env.example .env.local
# DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
# RECEIPTS_HMAC_SECRET=<32+ char secret>

npm install
node -e "
  const postgres = require('postgres');
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  Promise.all([
    sql\`CREATE TABLE IF NOT EXISTS receipts_sources (
      id text PRIMARY KEY, user_id uuid NOT NULL,
      title text NOT NULL, body text NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL)\`,
    sql\`CREATE TABLE IF NOT EXISTS receipts_ledger (
      receipt_hash text PRIMARY KEY, user_id uuid NOT NULL,
      seq integer NOT NULL, kind text NOT NULL,
      prompt text NOT NULL, prompt_hash text NOT NULL,
      output text NOT NULL, output_hash text NOT NULL,
      citation_ids jsonb NOT NULL, decision text,
      prev_hash text NOT NULL, created_at text NOT NULL)\`
  ]).then(() => sql.end())
"

npm run dev
```

Open `http://localhost:3000/aria` and click **Seed demo**.

---

## Why it is ARI-native

- Lives in `modules-custom/receipts` — drop-in ARI module
- Reads any ARI `module.json` and produces a typed risk profile
- Uses ARI-style routes, Drizzle schema, dashboard widget
- Produces copy-paste guardrail code for other ARI module authors
- Adds a sidebar entry and dashboard widget to the ARI shell

---

## Tech stack

- **Next.js 16** (App Router) · **TypeScript 5** · **Tailwind CSS 3**
- **Drizzle ORM** + **postgres.js** + PostgreSQL 15 (Supabase-compatible or Cloud SQL)
- **Vitest 2** — 11 pure-core unit tests, no DB required
- No external AI calls — fully deterministic (LLM is optional garnish)

---

## Test suite

```bash
npm test
# 11 tests, 3 files — hash chain integrity, RAG/refusal, consequence engine
```

---

## Disclosure

The consequence-engine, citation-first architect, and hash-chained ledger patterns are **adapted from the authors' prior systems** (a farm-operations action-guardrail engine, a citation-first institutional AI architect, and a carbon-MRV audit-anchor ledger). The ARI module integration, Module Risk Scanner, Policy Simulator, Cleo Trust Architect adaptation, scanner-to-policy workflow, verifier UI, and all demo content were built for ARI.HACK.

MIT licensed · fully open source.

---

## License

MIT © 2026 CropMind Inc.
