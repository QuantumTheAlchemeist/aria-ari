# ARIA — ARI's Trust Layer

ARIA is a Trust Studio built for ARI. It ports the full org-brain Cleo walkthrough
pattern into ARI: picker, stack overview, one trust layer at a time, diagrams, Continue
controls, and a final module policy receipt. Then it makes ARI's AI verifiable: every
answer is grounded in cited sources or refused, every risky action is gated by a consequence
preview + approval, and every interaction is sealed into a hash-chained, tamper-evident ledger.

> **ARI builds modules fast. ARIA makes them safe to trust.**

## Quick start

```bash
cp .env.example .env.local
# Fill in DATABASE_URL (Supabase or local Postgres)
npm install
npm run db:push   # creates receipts_sources + receipts_ledger tables
npm run dev
```

Open `http://localhost:3000/aria`.

## Demo (90 seconds)

1. Click **Seed demo** — loads 5 seed notes + the Vineyard Block A origin story.
2. Ask **"Who is leading the billing rewrite?"** → cited answer with `[1][2]`.
3. Ask something off-corpus → **refusal** (no hallucination).
4. Use **ARIA Trust Architect** → picker → stack overview → data/action/approval/ledger stages → final policy → **Seal trust receipt** for "Project Memory Copilot".
5. Click **Email 15 teammates** → `draft · typed` (high blast radius).
6. Click **Delete 60 notes** → `refuse` (exceeds 50-item safety ceiling).
7. Click **Verify** → all green ✓.
8. Click **Tamper (demo)** → then **Verify** → receipt #1 turns **red** with reason.
9. Receipt #0 is the pre-seeded Vineyard Block A refused spray decision.

## How it works

**ARIA Trust Architect**
A full staged walkthrough for ARI modules: picker, stack overview, one trust layer at a
time, diagrams, Continue controls, and a final policy that seals into the ledger as a `trust`
receipt. ARI creates modules fast — ARIA gives those modules a trust contract.

**Cited answers & refusals**
Deterministic keyword retrieval over your notes. Answers cite `[n]` markers. Queries
that don't reach the grounding threshold are refused — no hallucination.

**Consequence engine**
Classifies actions `act / draft / refuse` based on side effects, blast radius, and safety
ceilings (bulk deletes > 50 items are always refused). Drafts/escalations issue 5-minute
HMAC approval tokens.

**Tamper-evident ledger**
Each receipt stores `prev_hash` (the prior receipt's hash) + `receipt_hash` (SHA-256 of the
full canonical record including `prev_hash`). `verifyChain` recomputes the entire chain —
any edit, removal, or reorder breaks the chain and pinpoints the altered entry.

## Tech stack

- **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS**
- **Drizzle ORM** + PostgreSQL (Supabase-compatible)
- **Vitest** for pure-core unit tests
- No external AI calls — fully deterministic (LLM is optional garnish)

## Disclosure (ARI.HACK rules)

The consequence-engine, citation-first architect, and hash-chained-ledger patterns are
**adapted from the authors' production systems** (a farm-operations action-guardrail engine,
a citation-first institutional AI architect, and a carbon-MRV audit-anchor ledger). The ARI
module integration, cited-answer/refusal flow, verifier, ARIA Trust Architect, gated-action
route, and all UI were built during ARI.HACK.
MIT licensed; fully open source.

## License

MIT © 2026
