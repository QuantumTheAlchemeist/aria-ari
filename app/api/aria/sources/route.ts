import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { getDb, getUserId } from "@receipts/lib/ari-adapter";
import { receiptsSources } from "@receipts/database/schema";
import { sha256Hex } from "@receipts/lib/hash";

const CreateBody = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
});

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const userId = await getUserId(req);
    const rows = await db
      .select()
      .from(receiptsSources)
      .where(eq(receiptsSources.userId, userId))
      .orderBy(asc(receiptsSources.createdAt));
    return NextResponse.json({ sources: rows });
  } catch (err) {
    console.error("[aria/sources GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const userId = await getUserId(req);
    const parsed = CreateBody.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { title, body } = parsed.data;
    // Deterministic ID from content hash so duplicate imports are idempotent
    const id = `src-${sha256Hex(userId + title + body).slice(0, 16)}`;

    await db
      .insert(receiptsSources)
      .values({ id, userId, title, body })
      .onConflictDoNothing();

    return NextResponse.json({ id });
  } catch (err) {
    console.error("[aria/sources POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
