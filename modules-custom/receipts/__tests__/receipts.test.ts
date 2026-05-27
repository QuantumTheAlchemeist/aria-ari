import { describe, it, expect } from "vitest";
import {
  buildContent,
  sealReceipt,
  verifyChain,
  GENESIS_HASH,
  type Receipt,
} from "../lib/receipts";

function chain(): Receipt[] {
  const r0 = sealReceipt(
    buildContent({
      seq: 0,
      kind: "answer",
      prompt: "q0",
      output: "a0",
      citation_ids: ["s1"],
      created_at: "2026-05-27T00:00:00Z",
    }),
    GENESIS_HASH
  );
  const r1 = sealReceipt(
    buildContent({
      seq: 1,
      kind: "refusal",
      prompt: "q1",
      output: "no",
      citation_ids: [],
      created_at: "2026-05-27T00:01:00Z",
    }),
    r0.receipt_hash
  );
  return [r0, r1];
}

describe("receipt ledger", () => {
  it("verifies an untampered chain", () => {
    expect(verifyChain(chain()).ok).toBe(true);
  });

  it("detects an edited output (in-place tamper)", () => {
    const c = chain();
    c[0] = { ...c[0], output: "a0-HACKED" };
    const res = verifyChain(c);
    expect(res.ok).toBe(false);
    expect(res.brokenAtSeq).toBe(0);
  });

  it("detects a removed link via prev_hash break", () => {
    const res = verifyChain([chain()[1]]);
    expect(res.ok).toBe(false);
    expect(res.brokenAtSeq).toBe(1);
  });
});
