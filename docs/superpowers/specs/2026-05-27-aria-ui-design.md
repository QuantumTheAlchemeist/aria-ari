# ARIA UI Redesign — Design Spec
Date: 2026-05-27

## Overview

Full layout and visual redesign of the ARIA product (ARI's Trust Layer). Approach B: new two-column dashboard shell, hero ledger visualization, stepped Trust Architect wizard, and a consistent light/minimal-pro design language across all components. No new dependencies — raw Tailwind CSS + CSS custom properties only.

Audience: hackathon judges (needs to wow quickly) and developers (needs to be genuinely usable). All 11 existing tests must continue to pass; only UI files change.

---

## 1. Design Foundation

### CSS Custom Properties (`app/globals.css`)

```css
:root {
  --c-surface:       #ffffff;
  --c-bg:            #f8f9fa;
  --c-border:        #e5e7eb;
  --c-border-strong: #d1d5db;
  --c-text:          #111827;
  --c-muted:         #6b7280;
  --c-success:       #059669;
  --c-warn:          #d97706;
  --c-danger:        #dc2626;
  --c-trust:         #7c3aed;
}
```

### Typography Scale
- Page headings: `text-sm font-semibold tracking-tight text-neutral-900`
- Section labels (caps): `text-xs font-medium uppercase tracking-widest text-neutral-400`
- Body: `text-sm text-neutral-600 leading-relaxed`
- Monospace (hashes, policy): `font-mono text-[11px] text-neutral-500`

### Card Standard
All panels: `rounded-xl border border-neutral-200 bg-white shadow-sm`
Card header: `px-4 pt-4 pb-3 border-b border-neutral-100 flex items-center justify-between`
Card body: `p-4 space-y-4`

### Decision Color System (consistent across all components)
| Decision | Border accent | Badge bg | Badge text |
|---|---|---|---|
| act / answer / verified | `border-l-4 border-emerald-500` | `bg-emerald-100` | `text-emerald-800` |
| draft / warn / medium | `border-l-4 border-amber-500` | `bg-amber-100` | `text-amber-800` |
| refuse / tamper / high | `border-l-4 border-red-500` | `bg-red-100` | `text-red-800` |
| trust / seal | `border-l-4 border-violet-500` | `bg-violet-100` | `text-violet-800` |

---

## 2. Page Shell (`app/aria/page.tsx`)

### Topbar (sticky, `h-14`)
- Background: `bg-white border-b border-neutral-200 sticky top-0 z-10`
- Left: `◆` glyph (emerald) + `ARIA` wordmark (`text-sm font-semibold`) + `ARI's Trust Layer` muted tagline
- Right: live chain-integrity badge — reads from a `verifyResult` prop passed down from the page component (the page already fetches `/api/aria/list` via `refreshKey`; topbar consumes the same state rather than making a second fetch)
  - Intact: `● Chain intact · N receipts` — emerald dot + emerald text
  - Broken: `● Broken at #N` — red dot + red text, links to ledger
- Far right: `← Dashboard` link (`text-xs text-neutral-400 hover:text-neutral-600`)

### Page Body
- `max-w-6xl mx-auto px-6 py-6` (wider than current `max-w-3xl`)
- `bg-neutral-50 min-h-screen` on `<body>`

### Two-Column Grid
```
<div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
  <div class="space-y-6">          <!-- LEFT: Ask + Scanner -->
  <div class="sticky top-[56px]">  <!-- RIGHT: Ledger -->
```
- Right column width: `320px` fixed
- Right column sticky: `top-[56px]` (below the `h-14` topbar)

### Full-Width Section (below the grid)
- `border-t border-neutral-100 mt-6 pt-6 space-y-6`
- Contains: Trust Architect → Policy Simulator → Decision Cards (in that order)

---

## 3. Ledger (`modules-custom/receipts/components/Ledger.tsx`)

### Card Header
- Title `ARIA Ledger` + chain status badge right-aligned (inline, not a separate row)
- Action buttons (`Seed demo`, `Verify`, `Tamper`) moved to a compact icon row below the header — `text-xs border rounded-md px-2.5 py-1 hover:bg-neutral-50`

### Hero Chain Visualization (`ReceiptTimeline.tsx`)
- Node: `w-3 h-3 rounded-full border-2` — color per kind (see color system above)
- Connector: `h-px flex-1` — same color as downstream node; turns red after broken node
- Genesis marker: muted filled square `w-2 h-2 bg-neutral-300`
- Broken node: red fill + `animate-pulse`
- Tooltip on hover: `title` attribute with `kind · prompt`
- Container: `overflow-x-auto` horizontal scroll when > ~12 nodes
- Height: ~`h-12` total (connector line + node + label below)

### Detail List
Each receipt row:
```
#3   [TRUST]   Seal: Project Memory Copilot trust policy   7a3f9c2e…   2m ago
```
- `#seq`: `text-xs font-mono text-neutral-400 w-8`
- Kind badge: pill per color system, `text-[10px] font-bold uppercase rounded px-1.5 py-0.5`
- Prompt: `text-sm text-neutral-700 truncate flex-1`
- Hash: `font-mono text-[10px] text-neutral-400` (first 16 chars + `…`)
- Timestamp: `text-[10px] text-neutral-400` (relative) — a small `formatRelative(iso: string): string` helper in the component file, returning e.g. `"2m ago"`, `"1h ago"`, `"3d ago"` using `Date.now()` diff
- Tampered row: `bg-red-50` full-row tint + `TAMPERED` badge
- Hover: `hover:bg-neutral-50 transition-colors`
- No dividers — tight `py-2` rows

---

## 4. Ask Panel (`modules-custom/receipts/components/AskPanel.tsx`)

### Input Row
- Input: `flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500`
- Button: `rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 disabled:opacity-40 transition-colors` with `→` arrow glyph

### Result Card
- Replace full-bg tint with `border-l-4` accent (per color system)
- Card: `rounded-lg border border-neutral-200 bg-white p-4 space-y-3`
- Kind label: `text-xs font-bold uppercase tracking-widest` + matching color
- Answer text: `text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap`
- Citations: collapsible section (`<details>` or state toggle), styled as footnotes — `text-xs text-neutral-500`, numbered, with source title in `font-medium text-neutral-700`

---

## 5. Module Scanner (`modules-custom/receipts/components/ModuleScanner.tsx`)

### Layout
- Card header includes collapse toggle right-aligned
- Preset chips: `rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium hover:bg-neutral-50 hover:border-neutral-400 transition-colors`
- Textarea: `font-mono text-xs bg-neutral-50 rounded-lg border border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-300`
- Scan button: `rounded-lg bg-neutral-900 hover:bg-neutral-700 text-white text-sm font-medium px-4 py-2`

### Risk Result Card
- Replace full-bg tint with `border-l-4` accent per risk level (emerald/amber/red/red)
- Risk badge: `rounded-full text-[10px] font-bold uppercase px-2 py-0.5`
- Risk items: `text-xs text-neutral-700 space-y-1` with `·` bullet
- Permissions: icon + label in muted `text-xs` chips
- `Send to Trust Architect →`: `rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 px-3 py-1.5 text-xs font-medium shadow-sm transition-colors` — prominent inside result

---

## 6. Trust Architect (`modules-custom/receipts/components/TrustArchitect.tsx`)

### Progress Stepper
Replaces the flat pill row. Rendered above the active stage panel.

```
① Picker  ②Overview  ③Data  ④Actions  ⑤Approval  ⑥Ledger  ⑦Benefits  ⑧Seal
  ●─────────○──────────○──────○──────────○───────────○────────○──────────○
```
- Completed step: `w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center` + checkmark
- Active step: `bg-neutral-900 text-white`
- Upcoming: `bg-white border-2 border-neutral-200 text-neutral-400`
- Connector line: `h-px flex-1 bg-neutral-200` (completed segment → `bg-emerald-200`)
- Labels: `text-[10px] text-neutral-500` below each node, active → `text-neutral-900 font-medium`
- Clicking completed step navigates back (existing behavior preserved)

### Stage Description
Replace plain `<p>` with an info callout:
`rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900`

### Picker Stage
- Module name + Workflow: `grid grid-cols-2 gap-4` with proper `<label>` wrappers
- Toggle groups (reads/actions/risks): each in `rounded-lg bg-neutral-50 p-3 space-y-2`
- Toggle chips: `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors`

### Stage Footer
```
[← Back]                    [Continue: Actions →]    Step 3 of 8
```
- Back: `text-sm text-neutral-500 hover:text-neutral-700`
- Continue: `rounded-lg bg-neutral-900 text-white text-sm font-medium px-4 py-2 hover:bg-neutral-700`
- Seal: `rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2.5`
- Step counter: `text-xs text-neutral-400` right-aligned

### Sealed Policy Output
`font-mono text-xs bg-neutral-950 text-emerald-400 rounded-lg p-4` — dark terminal feel, the one dark element in an otherwise light UI

---

## 7. Policy Simulator (`modules-custom/receipts/components/PolicySimulator.tsx`)

### Empty State (no module scanned)
Replace plain muted text with:
- Icon: `🔬` or shield SVG, centered
- Heading: `text-sm font-medium text-neutral-500`
- Body: `text-xs text-neutral-400`

### Scenario Chips
Same treatment as Trust Architect toggles — `rounded-full border px-3 py-1 text-xs font-medium`
Selected: `bg-neutral-900 text-white border-neutral-900`

### Result Card
- `border-l-4` accent per decision (per color system)
- Decision badge: `rounded px-2 py-0.5 text-[10px] font-bold uppercase`
- Reason: `text-xs text-neutral-700 leading-relaxed`
- Policy line: `inline-block bg-neutral-100 rounded px-2 py-0.5 font-mono text-[11px] text-neutral-600`

---

## 8. Decision Cards (`modules-custom/receipts/components/DecisionCards.tsx`)

### Header
Section title: `ACTION TRIAGE` (replaces "Ask the assistant to act")

### Demo Buttons
Same chip treatment as scenario chips.

### Decision Result
- `border-l-4` accent per decision
- `act`: add `⚡ Executes automatically` note in `text-xs text-neutral-500 italic`
- `draft` approve button: `rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium px-3 py-1.5` with `🔒` prefix glyph

---

## 9. Dashboard (`app/page.tsx`)

`DashboardWidget` gets same card treatment:
- Larger chain status number (`text-3xl font-bold`)
- Breakdown becomes colored dots + labels instead of plain text
- Hover: `hover:shadow-md hover:-translate-y-0.5 transition-all`

---

## Implementation Constraints

- No new npm packages
- All 11 existing vitest tests must pass (tests cover API logic, not UI)
- TypeScript must remain clean (`tsc --noEmit`)
- Component props/interfaces unchanged — only JSX and className strings change
- CSS vars added to `globals.css`; Tailwind config unchanged
- The `ReceiptTimeline` hero chain is the only structurally new sub-component; it replaces the existing implementation in the same file
