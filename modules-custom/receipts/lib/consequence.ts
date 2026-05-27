import { createHmac } from "node:crypto";
import { canonicalJson, sha256Hex } from "./hash";

export type ConsequenceDecisionType = "act" | "draft" | "refuse";
export type ConfirmationTier = "none" | "one_tap" | "typed";
export type SideEffect = "create" | "update" | "delete" | "email" | "push" | "external";

export interface ConsequenceProfile {
  toolName: string;
  label: string;
  sideEffects: SideEffect[];
  defaultTier: ConfirmationTier;
  producesDraft: boolean;
  preview: (input: Record<string, unknown>) => string;
}

export const PROFILES: Record<string, ConsequenceProfile> = {
  create_task: {
    toolName: "create_task",
    label: "Create task",
    sideEffects: ["create"],
    defaultTier: "none",
    producesDraft: false,
    preview: (i) => `Create a task: "${String(i.title ?? "untitled")}".`,
  },
  draft_email: {
    toolName: "draft_email",
    label: "Email the team",
    sideEffects: ["email"],
    defaultTier: "one_tap",
    producesDraft: true,
    preview: (i) =>
      `Draft (not send) an email to ${Number(i.recipientCount ?? 1)} recipient(s).`,
  },
  delete_notes: {
    toolName: "delete_notes",
    label: "Delete notes",
    sideEffects: ["delete"],
    defaultTier: "one_tap",
    producesDraft: false,
    preview: (i) =>
      `Permanently delete ${Number(i.count ?? 1)} note(s). This cannot be undone.`,
  },
};

function unknownProfile(toolName: string): ConsequenceProfile {
  return {
    toolName,
    label: toolName,
    sideEffects: ["external"],
    defaultTier: "typed",
    producesDraft: true,
    preview: () => `Unknown action "${toolName}" — treated as high-risk.`,
  };
}

export interface ConsequenceContext {
  toolName: string;
  toolInput: Record<string, unknown>;
  userId: string;
  affectedCount?: number;
  irreversible?: boolean;
  writeToolsEnabled?: boolean;
  permissionAllowed?: boolean;
}

export interface ConsequenceDecision {
  decision: ConsequenceDecisionType;
  tier: ConfirmationTier;
  reason: string;
  preview: string;
  inputHash: string;
  confirmationToken?: string;
  profile: ConsequenceProfile;
}

const TIER_ORDER: ConfirmationTier[] = ["none", "one_tap", "typed"];
const escalate = (a: ConfirmationTier, b: ConfirmationTier): ConfirmationTier =>
  TIER_ORDER[Math.max(TIER_ORDER.indexOf(a), TIER_ORDER.indexOf(b))];

const TOKEN_TTL_MS = 5 * 60 * 1000;

// In-process single-use token registry — prevents replay within the same process.
// Keys are token strings; values are expiry timestamps for periodic cleanup.
const usedTokens = new Map<string, number>();
function consumeToken(token: string, exp: number): boolean {
  if (usedTokens.has(token)) return false;
  usedTokens.set(token, exp);
  // Evict expired entries to prevent unbounded growth.
  if (usedTokens.size > 1000) {
    const now = Date.now();
    for (const [k, e] of usedTokens) if (e < now) usedTokens.delete(k);
  }
  return true;
}

const secret = () =>
  process.env.RECEIPTS_HMAC_SECRET &&
  process.env.RECEIPTS_HMAC_SECRET.length >= 16
    ? process.env.RECEIPTS_HMAC_SECRET
    : "receipts-dev-only-do-not-ship-secret";

const b64url = (b: Buffer) =>
  b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export interface TokenPayload {
  inputHash: string;
  toolName: string;
  userId: string;
  exp: number;
}

export function issueToken(p: TokenPayload): string {
  const body = b64url(Buffer.from(JSON.stringify(p)));
  return `${body}.${b64url(createHmac("sha256", secret()).update(body).digest())}`;
}

export function verifyToken(token: string): TokenPayload | null {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const i = token.lastIndexOf(".");
  const body = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (sig !== b64url(createHmac("sha256", secret()).update(body).digest()))
    return null;
  try {
    const p = JSON.parse(
      Buffer.from(
        body.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf8")
    );
    if (
      typeof p !== "object" ||
      typeof p.exp !== "number" ||
      typeof p.userId !== "string" ||
      typeof p.toolName !== "string" ||
      typeof p.inputHash !== "string"
    )
      return null;
    if (p.exp < Date.now()) return null;
    return p as TokenPayload;
  } catch {
    return null;
  }
}

export { consumeToken };

export function evaluateConsequence(ctx: ConsequenceContext): ConsequenceDecision {
  const profile = PROFILES[ctx.toolName] ?? unknownProfile(ctx.toolName);
  const inputHash = sha256Hex(canonicalJson(ctx.toolInput));
  const preview = profile.preview(ctx.toolInput);
  const n =
    ctx.affectedCount ??
    Number(ctx.toolInput.count ?? ctx.toolInput.recipientCount ?? 0);

  if (ctx.writeToolsEnabled === false || ctx.permissionAllowed === false)
    return {
      decision: "refuse",
      tier: "typed",
      reason: "Write actions are disabled for this assistant.",
      preview,
      inputHash,
      profile,
    };

  if (profile.sideEffects.includes("delete") && n > 50)
    return {
      decision: "refuse",
      tier: "typed",
      reason: `Refusing to delete ${n} items at once — exceeds the safety ceiling (50). Narrow the selection.`,
      preview,
      inputHash,
      profile,
    };

  let tier = profile.defaultTier;
  if (profile.sideEffects.includes("delete") && (ctx.irreversible ?? true))
    tier = escalate(tier, "typed");
  if (n > 10) tier = escalate(tier, "typed");

  if (profile.producesDraft || tier !== "none") {
    const token = issueToken({
      inputHash,
      toolName: ctx.toolName,
      userId: ctx.userId,
      exp: Date.now() + TOKEN_TTL_MS,
    });
    return {
      decision: "draft",
      tier,
      reason:
        tier === "typed"
          ? "High blast radius — type the confirmation to proceed."
          : "Routine write — one-tap approval required.",
      preview,
      inputHash,
      confirmationToken: token,
      profile,
    };
  }

  return {
    decision: "act",
    tier: "none",
    reason: "Safe action — no side effects requiring approval.",
    preview,
    inputHash,
    profile,
  };
}
