import { retrieve, type Source } from "./retrieval";

/** Minimum fraction of query terms grounded in a source before we answer.
 *  Below this threshold → refuse instead of hallucinate. */
export const MIN_SCORE = 0.34;

export interface Citation {
  id: string;
  title: string;
  snippet: string;
}

export interface AnswerResult {
  kind: "answer" | "refusal";
  text: string;
  citations: Citation[];
}

export function answerFromSources(
  query: string,
  sources: Source[]
): AnswerResult {
  const chunks = retrieve(query, sources, 3);
  if (chunks.length === 0 || chunks[0].score < MIN_SCORE) {
    return {
      kind: "refusal",
      text: "I can't ground an answer to that in your notes, so I won't answer. (No source passed the citation threshold.)",
      citations: [],
    };
  }
  const used = chunks.filter((c) => c.score >= MIN_SCORE * 0.6);
  const text = used
    .map(
      (c, i) =>
        `${c.snippet}${/[.!?]$/.test(c.snippet) ? "" : "."} [${i + 1}]`
    )
    .join(" ");
  return {
    kind: "answer",
    text,
    citations: used.map((c) => ({
      id: c.sourceId,
      title: c.sourceTitle,
      snippet: c.snippet,
    })),
  };
}
