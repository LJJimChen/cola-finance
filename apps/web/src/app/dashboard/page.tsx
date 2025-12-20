export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">Good Morning</p>
          <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-white">
            刷新
          </button>
          <button className="relative rounded-full border border-zinc-200 px-3 py-1">
            🔔
          </button>
        </div>
      </header>
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">总资产</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">￥0.00</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">当日收益</p>
          <p className="mt-2 text-lg font-semibold text-emerald-600">
            ￥0.00
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">累计收益</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">￥0.00</p>
        </div>
      </section>
    </div>
  );
}

