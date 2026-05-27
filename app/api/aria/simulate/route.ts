import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { simulateScenario } from "@receipts/lib/policy-sim";
import { getUserId } from "@receipts/lib/ari-adapter";

const Body = z.object({
  scenario: z.object({
    id: z.string().max(100),
    label: z.string().max(200),
    description: z.string().max(500),
    toolName: z.string().max(100),
    toolInput: z.record(z.unknown()).default({}),
    affectedCount: z.number().optional(),
    irreversible: z.boolean().optional(),
    kind: z.enum(["answer", "action"]),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid scenario" }, { status: 400 });
    }
    const userId = await getUserId(req);
    const result = simulateScenario(parsed.data.scenario, userId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[aria/simulate]", err);
    return NextResponse.json({ error: "Simulate failed" }, { status: 500 });
  }
}
