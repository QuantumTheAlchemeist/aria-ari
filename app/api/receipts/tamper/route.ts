import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, getUserId } from "@receipts/lib/ari-adapter";
import { receiptsLedger } from "@receipts/database/schema";

const Body = z.object({
  seq: z.number().int().nonnegative().default(1),
});

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const userId = await getUserId(req);

    const bodyText = await req.text();
    const parsed = Body.safeParse(
      bodyText ? JSON.parse(bodyText) : {}
    );
    const seq = parsed.success ? parsed.data.seq : 1;

    const [row] = await db
      .select()
      .from(receiptsLedger)
      .where(
        and(
          eq(receiptsLedger.userId, userId),
          eq(receiptsLedger.seq, seq)
        )
      );

    if (!row) {
      return NextResponse.json(
        { ok: false, error: `No receipt at seq ${seq}. Run /seed first, then /ask at least once.` },
        { status: 404 }
      );
    }

    await db
      .update(receiptsLedger)
      .set({ output: row.output + " [SILENTLY EDITED]" })
      .where(eq(receiptsLedger.receiptHash, row.receiptHash));

    return NextResponse.json({ ok: true, tamperedSeq: seq });
  } catch (err) {
    console.error("[receipts/tamper]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
