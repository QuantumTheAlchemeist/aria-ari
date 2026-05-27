import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { getDb, getUserId } from "@receipts/lib/ari-adapter";
import { receiptsSources, receiptsLedger } from "@receipts/database/schema";
import { answerFromSources } from "@receipts/lib/answer";
import {
  buildContent,
  sealReceipt,
  toRow,
  GENESIS_HASH,
} from "@receipts/lib/receipts";

const Body = z.object({ question: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 }
      );
    }
    const { question } = parsed.data;

    const db = getDb();
    const userId = await getUserId(req);

    const src = await db
      .select()
      .from(receiptsSources)
      .where(eq(receiptsSources.userId, userId));

    const result = answerFromSources(
      question,
      src.map((s) => ({ id: s.id, title: s.title, text: s.body }))
    );

    const ledger = await db
      .select()
      .from(receiptsLedger)
      .where(eq(receiptsLedger.userId, userId))
      .orderBy(asc(receiptsLedger.seq));

    const seq = ledger.length;
    const prev = ledger.length
      ? ledger[ledger.length - 1].receiptHash
      : GENESIS_HASH;

    const sealed = sealReceipt(
      buildContent({
        seq,
        kind: result.kind === "answer" ? "answer" : "refusal",
        prompt: question,
        output: result.text,
        citation_ids: result.citations.map((c) => c.id),
        created_at: new Date().toISOString(),
      }),
      prev
    );
    await db.insert(receiptsLedger).values(toRow(sealed, userId));

    return NextResponse.json({ result, receipt: sealed });
  } catch (err) {
    console.error("[receipts/ask]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
