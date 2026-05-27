import { describe, it, expect } from "vitest";
import { answerFromSources } from "../lib/answer";
import type { Source } from "../lib/retrieval";

const SOURCES: Source[] = [
  {
    id: "note-roadmap",
    title: "Q3 Roadmap",
    text: "The Q3 roadmap prioritizes the billing rewrite and the mobile app beta. Billing migration starts in July.",
  },
  {
    id: "note-standup",
    title: "Standup",
    text: "Maria is leading the billing rewrite. We agreed to freeze new feature requests until the billing migration ships.",
  },
];

describe("answerFromSources", () => {
  it("answers a grounded question with a citation marker", () => {
    const r = answerFromSources("Who is leading the billing rewrite?", SOURCES);
    expect(r.kind).toBe("answer");
    expect(r.citations.length).toBeGreaterThan(0);
    expect(r.text).toMatch(/\[1\]/);
  });

  it("refuses an ungrounded question", () => {
    const r = answerFromSources(
      "What is the airspeed of an unladen swallow?",
      SOURCES
    );
    expect(r.kind).toBe("refusal");
    expect(r.citations.length).toBe(0);
  });
});
