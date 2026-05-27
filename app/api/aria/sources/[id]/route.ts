import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, getUserId } from "@receipts/lib/ari-adapter";
import { receiptsSources } from "@receipts/database/schema";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const userId = await getUserId(req);
    const { id } = await params;
    await db
      .delete(receiptsSources)
      .where(
        and(
          eq(receiptsSources.id, id),
          eq(receiptsSources.userId, userId)
        )
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[aria/sources DELETE]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
