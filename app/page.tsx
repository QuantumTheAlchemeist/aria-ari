"use client";
import { DashboardWidget } from "@receipts/components/DashboardWidget";

const OTHER_MODULES = [
  {
    name: "Billing Copilot",
    desc: "Invoice parsing, payment tracking, and spend anomaly detection.",
    status: "active",
    tags: ["finance", "read-only"],
    stat: "142 queries today",
    risk: null,
  },
  {
    name: "Team Memory",
    desc: "Searchable org knowledge base seeded from docs, wikis, and standups.",
    status: "active",
    tags: ["knowledge", "read-only"],
    stat: "38 sources indexed",
    risk: null,
  },
  {
    name: "Doc Generator",
    desc: "Drafts PRDs, runbooks, and meeting summaries from project context.",
    status: "active",
    tags: ["documents", "write"],
    stat: "12 drafts this week",
    risk: "medium",
  },
  {
    name: "Calendar Assistant",
    desc: "Schedules meetings, resolves conflicts, and sends invites on behalf of users.",
    status: "idle",
    tags: ["calendar", "actions"],
    stat: "Last used 2d ago",
    risk: "high",
  },
  {
    name: "Onboarding Guide",
    desc: "Walks new engineers through setup, answers questions, and tracks progress.",
    status: "active",
    tags: ["knowledge", "tasks"],
    stat: "3 active sessions",
    risk: null,
  },
];

const RISK_BADGE: Record<string, string> = {
  medium: "bg-amber-50 border-amber-200 text-amber-700",
  high:   "bg-red-50 border-red-200 text-red-700",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-400",
  idle:   "bg-neutral-300",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Topbar */}
      <header className="sticky top-0 z-10 h-14 bg-white border-b border-neutral-200 flex items-center px-6 gap-6">
        <span className="text-emerald-600 font-bold text-lg select-none">◆</span>
        <span className="text-sm font-semibold tracking-tight text-neutral-900">ARI</span>
        <nav className="hidden sm:flex items-center gap-5 ml-4">
          {["Dashboard", "Modules", "Sources", "Settings"].map((label) => (
            <span
              key={label}
              className={`text-xs font-medium cursor-pointer transition-colors ${
                label === "Dashboard"
                  ? "text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {label}
            </span>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-neutral-400 hidden md:inline">workspace: acme-corp</span>
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold select-none">
            AC
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Page title */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Dashboard</h1>
            <p className="text-sm text-neutral-500 mt-0.5">6 modules installed · acme-corp workspace</p>
          </div>
          <button className="rounded-lg bg-neutral-900 px-4 py-2 text-xs text-white font-medium hover:bg-neutral-700 transition-colors">
            + Install module
          </button>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Installed modules", value: "6", sub: "2 with write access" },
            { label: "Active sources",    value: "38", sub: "across all modules" },
            { label: "Receipts today",    value: "27", sub: "2 refusals · 1 trust" },
            { label: "Chain status",      value: "✓ Verified", sub: "last checked just now", green: true },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white border border-neutral-200 p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">{s.label}</p>
              <p className={`mt-1.5 text-2xl font-bold ${s.green ? "text-emerald-600" : "text-neutral-900"}`}>
                {s.value}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Modules section */}
        <div>
          <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3">
            Installed modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ARIA — featured widget */}
            <DashboardWidget />

            {/* Other modules */}
            {OTHER_MODULES.map((m) => (
              <div
                key={m.name}
                className="rounded-xl border border-neutral-200 bg-white p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[m.status]} inline-block`} />
                      <span className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                        {m.name}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1.5 leading-snug">{m.desc}</p>
                  </div>
                  {m.risk && (
                    <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${RISK_BADGE[m.risk]}`}>
                      {m.risk} risk
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-auto pt-1 border-t border-neutral-50">
                  <div className="flex gap-1.5 flex-wrap">
                    {m.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-neutral-100 text-neutral-500 rounded px-1.5 py-0.5 font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-neutral-400">{m.stat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity strip */}
        <div>
          <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3">
            Recent activity
          </h2>
          <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-50">
            {[
              { dot: "bg-violet-500", label: "Trust receipt sealed", detail: "ARIA · Project Memory Copilot policy", time: "just now" },
              { dot: "bg-emerald-500", label: "Cited answer", detail: "ARIA · Who is leading the billing rewrite?", time: "8m ago" },
              { dot: "bg-amber-500",  label: "Refusal", detail: "ARIA · What is our Mars launch budget?", time: "9m ago" },
              { dot: "bg-blue-500",   label: "Task created", detail: "Billing Copilot · Review Q3 invoices", time: "1h ago" },
              { dot: "bg-neutral-300", label: "Source indexed", detail: "Team Memory · Security Policy updated", time: "2h ago" },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`w-2 h-2 rounded-full ${a.dot} shrink-0`} />
                <span className="text-sm font-medium text-neutral-700 w-36 shrink-0">{a.label}</span>
                <span className="text-sm text-neutral-400 truncate flex-1">{a.detail}</span>
                <span className="text-xs text-neutral-300 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
