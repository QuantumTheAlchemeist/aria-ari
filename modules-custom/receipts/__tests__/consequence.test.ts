import { describe, it, expect } from "vitest";
import {
  evaluateConsequence,
  issueToken,
  verifyToken,
} from "../lib/consequence";

describe("consequence engine", () => {
  it("acts on a safe create", () => {
    expect(
      evaluateConsequence({
        toolName: "create_task",
        toolInput: { title: "x" },
        userId: "u",
      }).decision
    ).toBe("act");
  });

  it("drafts + escalates to typed when emailing many recipients", () => {
    const d = evaluateConsequence({
      toolName: "draft_email",
      toolInput: { recipientCount: 15 },
      userId: "u",
      affectedCount: 15,
    });
    expect(d.decision).toBe("draft");
    expect(d.tier).toBe("typed");
    expect(d.confirmationToken).toBeTruthy();
  });

  it("refuses an irreversible bulk delete over the ceiling", () => {
    expect(
      evaluateConsequence({
        toolName: "delete_notes",
        toolInput: { count: 60 },
        userId: "u",
        affectedCount: 60,
        irreversible: true,
      }).decision
    ).toBe("refuse");
  });

  it("drafts at the ceiling (n=50) and refuses just above it (n=51)", () => {
    expect(
      evaluateConsequence({
        toolName: "delete_notes",
        toolInput: { count: 50 },
        userId: "u",
        affectedCount: 50,
        irreversible: true,
      }).decision
    ).toBe("draft");
    expect(
      evaluateConsequence({
        toolName: "delete_notes",
        toolInput: { count: 51 },
        userId: "u",
        affectedCount: 51,
        irreversible: true,
      }).decision
    ).toBe("refuse");
  });

  it("round-trips a valid token, rejects a tampered one", () => {
    const t = issueToken({
      inputHash: "h",
      toolName: "delete_notes",
      userId: "u",
      exp: Date.now() + 60000,
    });
    expect(verifyToken(t)?.userId).toBe("u");
    expect(verifyToken(t.slice(0, -2) + "xx")).toBeNull();
  });
});
