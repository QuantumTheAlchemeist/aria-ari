"use client";
import { useEffect, useState, useCallback } from "react";
import { API_BASE } from "../lib/api-base";

interface Source {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
}

interface SourcesListResponse {
  sources: Source[];
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max) + "…";
}

export function SourcesPanel() {
  const [sources, setSources] = useState<Source[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add-form state
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Seed button state
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const r = await fetch(`${API_BASE}/sources`);
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setFetchError(
          (e as { error?: string }).error ?? `Request failed (${r.status})`
        );
        return;
      }
      const data: SourcesListResponse = await r.json();
      setSources(data.sources);
    } catch {
      setFetchError("Network error — is the dev server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleDelete(id: string) {
    try {
      const r = await fetch(`${API_BASE}/sources/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setFetchError(
          (e as { error?: string }).error ?? "Delete failed"
        );
        return;
      }
      await refresh();
    } catch {
      setFetchError("Network error while deleting");
    }
  }

  async function handleSave() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const r = await fetch(`${API_BASE}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setSaveError((e as { error?: string }).error ?? "Save failed");
        return;
      }
      setTitle("");
      setBody("");
      setFormOpen(false);
      await refresh();
    } catch {
      setSaveError("Network error while saving");
    } finally {
      setSaving(false);
    }
  }

  async function handleSeedDemo() {
    setSeeding(true);
    setSeedError(null);
    try {
      const r = await fetch(`${API_BASE}/seed`, { method: "POST" });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setSeedError((e as { error?: string }).error ?? "Seed failed");
        return;
      }
      await refresh();
    } catch {
      setSeedError("Network error while seeding");
    } finally {
      setSeeding(false);
    }
  }

  const count = sources.length;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Knowledge Base</h3>
          <p className="text-xs text-neutral-500">
            {loading ? "Loading…" : `${count} source${count === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          className="text-xs text-neutral-400 hover:text-neutral-600 border rounded px-2 py-1 transition-colors"
          onClick={handleSeedDemo}
          disabled={seeding}
          title="Wipe and reload sample knowledge base"
        >
          {seeding ? "Loading…" : "Load sample knowledge base"}
        </button>
      </div>

      {/* Fetch / seed errors */}
      {(fetchError ?? seedError) && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
          {fetchError ?? seedError}
        </p>
      )}

      {/* Source list */}
      {!loading && sources.length === 0 && !fetchError && (
        <p className="text-xs text-neutral-400 py-2">
          No sources yet — add one below or load the sample knowledge base.
        </p>
      )}

      {sources.length > 0 && (
        <ul className="divide-y">
          {sources.map((src) => (
            <li key={src.id} className="flex items-start gap-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {src.title}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                  {truncate(src.body, 120)}
                </p>
              </div>
              <button
                className="flex-shrink-0 text-neutral-300 hover:text-red-500 transition-colors text-base leading-none mt-0.5"
                onClick={() => void handleDelete(src.id)}
                aria-label={`Delete source: ${src.title}`}
                title="Delete"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Collapsible add form */}
      <div className="border-t pt-3 space-y-2">
        <button
          className="text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
          onClick={() => {
            setFormOpen((x) => !x);
            setSaveError(null);
          }}
        >
          {formOpen ? "↑ Cancel" : "＋ Add source"}
        </button>

        {formOpen && (
          <div className="space-y-2">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Body — paste notes, policies, or any reference text…"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={saving}
            />

            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                {saveError}
              </p>
            )}

            <button
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white font-medium disabled:opacity-50 hover:bg-emerald-700 transition-colors"
              onClick={handleSave}
              disabled={saving || !title.trim() || !body.trim()}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
