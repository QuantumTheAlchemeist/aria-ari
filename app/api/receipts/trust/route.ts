import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { getDb, getUserId } from "@receipts/lib/ari-adapter";
import { receiptsLedger } from "@receipts/database/schema";
import { buildContent, sealReceipt, toRow, GENESIS_HASH } from "@receipts/lib/receipts";
import { buildFinalPolicy } from "@receipts/lib/cleo";

const Body = z.object({
  moduleName: z.string().min(1).default("AI Workflow"),
  workflow: z.enum(["knowledge", "tasks", "email", "documents", "finance", "custom"]).default("knowledge"),
  reads: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
  bottlenecks: z.array(z.string()).default([]),
  owner: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const userId = await getUserId(req);
    const input = Body.parse(await req.json());
    const output = buildFinalPolicy(input);

    const ledger = await db
      .select()
      .from(receiptsLedger)
      .where(eq(receiptsLedger.userId, userId))
      .orderBy(asc(receiptsLedger.seq));

    const seq = ledger.length;
    const prev = ledger.length ? ledger[ledger.length - 1].receiptHash : GENESIS_HASH;
    const prompt = `Cleo trust review: ${input.moduleName} workflow=${input.workflow} reads=${input.reads.join("|")} actions=${input.actions.join("|")} bottlenecks=${input.bottlenecks.join("|")}`;

    const sealed = sealReceipt(
      buildContent({ seq, kind: "trust", prompt, output, citation_ids: [], decision: "draft", created_at: new Date().toISOString() }),
      prev
    );
    await db.insert(receiptsLedger).values(toRow(sealed, userId));

    return NextResponse.json({ policy: output, receipt: sealed });
  } catch (err) {
    console.error("[receipts/trust]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
