import { DashboardWidget } from "@receipts/components/DashboardWidget";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            ARI Dashboard
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Installed modules</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardWidget />
        </div>
      </div>
    </div>
  );
}
