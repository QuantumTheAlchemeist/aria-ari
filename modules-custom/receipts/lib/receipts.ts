import { canonicalJson, sha256Hex } from "./hash";

export type ReceiptKind = "answer" | "refusal" | "action" | "trust";
export const GENESIS_HASH = "0".repeat(64);

export interface ReceiptContent {
  seq: number;
  kind: ReceiptKind;
  prompt: string;
  prompt_hash: string;
  output: string;
  output_hash: string;
  citation_ids: string[];
  decision: string | null;
  created_at: string;
}
export interface Receipt extends ReceiptContent {
  prev_hash: string;
  receipt_hash: string;
}

export function buildContent(a: {
  seq: number;
  kind: ReceiptKind;
  prompt: string;
  output: string;
  citation_ids: string[];
  decision?: string | null;
  created_at: string;
}): ReceiptContent {
  return {
    seq: a.seq,
    kind: a.kind,
    prompt: a.prompt,
    prompt_hash: sha256Hex(a.prompt),
    output: a.output,
    output_hash: sha256Hex(a.output),
    citation_ids: a.citation_ids,
    decision: a.decision ?? null,
    created_at: a.created_at,
  };
}

export function computeReceiptHash(
  c: ReceiptContent,
  prevHash: string
): string {
  return sha256Hex(canonicalJson({ ...c, prev_hash: prevHash }));
}

export function sealReceipt(c: ReceiptContent, prevHash: string): Receipt {
  return { ...c, prev_hash: prevHash, receipt_hash: computeReceiptHash(c, prevHash) };
}

export interface VerifyResult {
  ok: boolean;
  brokenAtSeq?: number;
  reason?: string;
}

/** Recompute the whole chain. Catches in-place content edits, reseal-less
 *  tampering, and reorder/insert/remove. */
export function verifyChain(receipts: Receipt[]): VerifyResult {
  const ordered = [...receipts].sort((a, b) => a.seq - b.seq);
  let prev = GENESIS_HASH;
  for (const r of ordered) {
    if (r.prev_hash !== prev)
      return {
        ok: false,
        brokenAtSeq: r.seq,
        reason: "prev_hash mismatch (entry inserted, removed, or reordered)",
      };
    if (
      r.prompt_hash !== sha256Hex(r.prompt) ||
      r.output_hash !== sha256Hex(r.output)
    )
      return {
        ok: false,
        brokenAtSeq: r.seq,
        reason: "content hash mismatch (prompt/output edited after sealing)",
      };
    const content: ReceiptContent = {
      seq: r.seq,
      kind: r.kind,
      prompt: r.prompt,
      prompt_hash: r.prompt_hash,
      output: r.output,
      output_hash: r.output_hash,
      citation_ids: r.citation_ids,
      decision: r.decision,
      created_at: r.created_at,
    };
    if (computeReceiptHash(content, r.prev_hash) !== r.receipt_hash)
      return {
        ok: false,
        brokenAtSeq: r.seq,
        reason: "receipt_hash mismatch (record altered)",
      };
    prev = r.receipt_hash;
  }
  return { ok: true };
}

/** Map a sealed Receipt to a DB row (Drizzle column keys).
 *  createdAt is stored explicitly so verifyChain can recompute the same hash. */
export function toRow(r: Receipt, userId: string) {
  return {
    receiptHash: r.receipt_hash,
    userId,
    seq: r.seq,
    kind: r.kind,
    prompt: r.prompt,
    promptHash: r.prompt_hash,
    output: r.output,
    outputHash: r.output_hash,
    citationIds: r.citation_ids,
    decision: r.decision,
    prevHash: r.prev_hash,
    createdAt: r.created_at,
  };
}

/** Map a DB row back to a Receipt. */
export function fromRow(row: {
  seq: number;
  kind: string;
  prompt: string;
  promptHash: string;
  output: string;
  outputHash: string;
  citationIds: string[] | null;
  decision: string | null;
  createdAt: string | null;
  prevHash: string;
  receiptHash: string;
}): Receipt {
  return {
    seq: row.seq,
    kind: row.kind as ReceiptKind,
    prompt: row.prompt,
    prompt_hash: row.promptHash,
    output: row.output,
    output_hash: row.outputHash,
    citation_ids: row.citationIds ?? [],
    decision: row.decision ?? null,
    created_at: row.createdAt ?? "",
    prev_hash: row.prevHash,
    receipt_hash: row.receiptHash,
  };
}
