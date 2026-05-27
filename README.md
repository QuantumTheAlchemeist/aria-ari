# Receipts — a verifiable trust layer for ARI's AI

Receipts makes ARI's AI verifiable: every answer is grounded in cited sources or refused,
every risky action is gated by a consequence preview + approval, and every interaction is
sealed into a hash-chained, tamper-evident ledger you can independently verify.

## Quick start

```bash
cp .env.example .env.local
# Fill in DATABASE_URL (Supabase or local Postgres)
npm install
npm run db:push   # creates receipts_sources + receipts_ledger tables
npm run dev
```

Open `http://localhost:3000/receipts`.

## Demo (90 seconds)

1. Click **Seed demo** — loads 5 seed notes + the Vineyard Block A origin story.
2. Ask **"Who is leading the billing rewrite?"** → cited answer with `[1][2]`.
3. Ask something off-corpus → **refusal** (no hallucination).
4. Click **Email 15 teammates** → `draft · typed` (high blast radius).
5. Click **Delete 60 notes** → `refuse` (exceeds 50-item safety ceiling).
6. Click **Verify** → all green ✓.
7. Click **Tamper (demo)** → then **Verify** → receipt #1 turns **red** with reason.
8. Receipt #0 is the pre-seeded Vineyard Block A refused spray decision.

## How it works

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

The consequence-engine pattern and hash-chained-ledger pattern are **adapted from the authors'
production systems** (a farm-operations action-guardrail engine and a carbon-MRV audit-anchor
ledger). The ARI module integration, cited-answer/refusal flow, verifier, gated-action route,
and all UI were built during ARI.HACK. MIT licensed; fully open source.

## License

MIT © 2026
