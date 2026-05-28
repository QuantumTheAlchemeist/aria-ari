import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, getUserId } from "@receipts/lib/ari-adapter";
import { receiptsSources, receiptsLedger } from "@receipts/database/schema";
import { SOURCES, VINEYARD_DECISION } from "@receipts/lib/seed-data";
import {
  buildContent,
  sealReceipt,
  toRow,
  GENESIS_HASH,
} from "@receipts/lib/receipts";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const userId = await getUserId(req);

    await db
      .delete(receiptsLedger)
      .where(eq(receiptsLedger.userId, userId));
    await db
      .delete(receiptsSources)
      .where(eq(receiptsSources.userId, userId));

    // Prefix IDs with a user-specific token so multiple users can each seed
    // their own copy without hitting the global primary key constraint.
    const prefix = userId.replace(/-/g, "").slice(0, 8);
    const scopedId = (id: string) => `${prefix}-${id}`;

    for (const s of SOURCES) {
      await db
        .insert(receiptsSources)
        .values({ id: scopedId(s.id), userId, title: s.title, body: s.text });
    }

    const r0 = sealReceipt(
      buildContent({
        seq: 0,
        kind: "refusal",
        prompt: VINEYARD_DECISION.prompt,
        output: VINEYARD_DECISION.output,
        citation_ids: VINEYARD_DECISION.citationIds.map(scopedId),
        decision: VINEYARD_DECISION.decision,
        created_at: new Date().toISOString(),
      }),
      GENESIS_HASH
    );
    await db.insert(receiptsLedger).values(toRow(r0, userId));

    return NextResponse.json({ ok: true, seeded: SOURCES.length });
  } catch (err) {
    console.error("[aria/seed]", err);
    return NextResponse.json(
      { ok: false, error: "Seed failed. Check DATABASE_URL and run db:push." },
      { status: 500 }
    );
  }
}
