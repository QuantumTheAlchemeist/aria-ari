import { createHash } from "node:crypto";

/** Stable canonical JSON: keys sorted recursively, so structurally identical
 *  inputs hash identically regardless of key order. */
export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalJson).join(",") + "]";
  const obj = v as Record<string, unknown>;
  return (
    "{" +
    Object.keys(obj)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonicalJson(obj[k]))
      .join(",") +
    "}"
  );
}

export function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
