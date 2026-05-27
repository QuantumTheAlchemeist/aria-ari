import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { getDb, getUserId } from "@receipts/lib/ari-adapter";
import { receiptsLedger } from "@receipts/database/schema";
import { fromRow, verifyChain } from "@receipts/lib/receipts";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const userId = await getUserId(req);

    const rows = await db
      .select()
      .from(receiptsLedger)
      .where(eq(receiptsLedger.userId, userId))
      .orderBy(asc(receiptsLedger.seq));

    const receipts = rows.map(fromRow);
    return NextResponse.json({ receipts, verify: verifyChain(receipts) });
  } catch (err) {
    console.error("[aria/list]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
