export interface Source {
  id: string;
  title: string;
  text: string;
}

export interface Chunk {
  sourceId: string;
  sourceTitle: string;
  snippet: string;
  score: number;
}

const STOP = new Set([
  "the", "a", "an", "is", "are", "of", "to", "and", "or", "in", "on",
  "for", "do", "does", "should", "we", "i", "it", "this", "that", "with",
  "at", "be", "can", "my", "who", "what", "when", "where", "how",
  "leading", "lead",
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
}

/** Score each source by fraction of (content) query terms present; return
 *  top-k with a best-matching snippet. */
export function retrieve(query: string, sources: Source[], k = 3): Chunk[] {
  const q = new Set(tokens(query));
  if (q.size === 0) return [];
  return sources
    .map((s) => {
      const st = new Set(tokens(s.text));
      const overlap = [...q].filter((t) => st.has(t)).length;
      const score = overlap / q.size;
      const sentences = s.text.split(/(?<=[.!?])\s+/);
      const hit =
        sentences.find((sen) => tokens(sen).some((t) => q.has(t))) ?? s.text;
      return {
        sourceId: s.id,
        sourceTitle: s.title,
        snippet: hit.slice(0, 220),
        score,
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
