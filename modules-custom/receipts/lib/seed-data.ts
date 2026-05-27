import type { Source } from "./retrieval";

export const SOURCES: Source[] = [
  {
    id: "note-roadmap",
    title: "Q3 Roadmap",
    text: "The Q3 roadmap prioritizes the billing rewrite and the mobile app beta. Billing migration starts in July and must finish before the September investor update.",
  },
  {
    id: "note-standup",
    title: "Standup 2026-05-20",
    text: "Maria is leading the billing rewrite. The mobile beta is blocked on the design review next week. We agreed to freeze new feature requests until the billing migration ships.",
  },
  {
    id: "note-vendor",
    title: "Vendor Contract",
    text: "The Stripe contract renews annually on October 1. Early termination requires 60 days notice. Our plan caps at 100k monthly active customers.",
  },
  {
    id: "note-onboarding",
    title: "Onboarding",
    text: "New engineers get a laptop, GitHub access, and a buddy. The first task is always to ship a one-line change to production to validate the pipeline.",
  },
  {
    id: "note-security",
    title: "Security Policy",
    text: "All production access requires hardware 2FA. Secrets live in the vault, never in env files committed to git. Audit logs are retained for 12 months.",
  },
];

/** Origin-story receipt, pre-sealed at seq 0 — a refused organic-spray decision.
 *  Shows the engine's real escalation logic (organic + stale scan + weather). */
export const VINEYARD_DECISION = {
  prompt: "Should we spray Block A tomorrow and notify the field team?",
  decision: "refuse" as const,
  output:
    "Recommendation: do NOT auto-spray Block A. (1) Block A is certified organic — a spray order escalates to typed-confirmation, certification-risk tier. (2) The last disease scan is 9 days old (freshness check failed). (3) Forecast shows rain within 12h (drift/runoff risk). Safer plan: schedule a drone scan, create a scouting task for rows 4-6, and DRAFT (not send) a note to the field lead.",
  citationIds: ["note-security", "note-roadmap", "note-standup"],
};
