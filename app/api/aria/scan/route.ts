import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scanModule, type ModuleManifest } from "@receipts/lib/module-scan";

const Body = z.object({ manifest: z.record(z.unknown()) });

export async function POST(req: NextRequest) {
  try {
    const { manifest } = Body.parse(await req.json());
    return NextResponse.json(scanModule(manifest as ModuleManifest));
  } catch (err) {
    console.error("[aria/scan]", err);
    return NextResponse.json({ error: "Invalid manifest" }, { status: 400 });
  }
}
