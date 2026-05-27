import { NextRequest, NextResponse } from "next/server";
import { eq, asc, lt } from "drizzle-orm";
import { z } from "zod";
import { getDb, getUserId } from "@receipts/lib/ari-adapter";
import { receiptsLedger, receiptsUsedTokens } from "@receipts/database/schema";
import {
  evaluateConsequence,
  verifyToken,
} from "@receipts/lib/consequence";
import {
  buildContent,
  sealReceipt,
  toRow,
  GENESIS_HASH,
} from "@receipts/lib/receipts";
import { canonicalJson, sha256Hex } from "@receipts/lib/hash";

const Propose = z.object({
  toolName: z.string(),
  toolInput: z.record(z.unknown()).default({}),
  affectedCount: z.number().optional(),
  irreversible: z.boolean().optional(),
});

const Approve = z.object({
  toolName: z.string(),
  toolInput: z.record(z.unknown()).default({}),
  token: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const parsed = Propose.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    return NextResponse.json(
      evaluateConsequence({ ...parsed.data, toolInput: parsed.data.toolInput as Record<string, unknown>, userId })
    );
  } catch (err) {
    console.error("[aria/action POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const userId = await getUserId(req);

    const parsed = Approve.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { toolName, toolInput, token } = parsed.data;

    const payload = verifyToken(token);
    const computedInputHash = sha256Hex(canonicalJson(toolInput as Record<string, unknown>));
    if (!payload || payload.userId !== userId || payload.toolName !== toolName || payload.inputHash !== computedInputHash) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired approval token" },
        { status: 400 }
      );
    }
    const tokenHash = sha256Hex(token);
    const [existing] = await db
      .select({ tokenHash: receiptsUsedTokens.tokenHash })
      .from(receiptsUsedTokens)
      .where(eq(receiptsUsedTokens.tokenHash, tokenHash));

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Token already used — submit a new approval" },
        { status: 400 }
      );
    }

    await db.insert(receiptsUsedTokens).values({
      tokenHash,
      userId,
      toolName,
      expiresAt: new Date(payload.exp),
    });

    // Also clean up expired tokens periodically (best-effort, don't await)
    db.delete(receiptsUsedTokens)
      .where(lt(receiptsUsedTokens.expiresAt, new Date()))
      .catch(() => {});

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
        kind: "action",
        prompt: `${toolName} ${JSON.stringify(toolInput)}`,
        output: `Approved & executed: ${toolName}`,
        citation_ids: [],
        decision: "act",
        created_at: new Date().toISOString(),
      }),
      prev
    );
    await db.insert(receiptsLedger).values(toRow(sealed, userId));

    return NextResponse.json({ ok: true, receipt: sealed });
  } catch (err) {
    console.error("[aria/action PUT]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
