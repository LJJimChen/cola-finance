import Link from "next/link";

const navItems = [
  { href: "/dashboard", labelEn: "Dashboard", labelZh: "总览" },
  { href: "/portfolio", labelEn: "Portfolio", labelZh: "持仓" },
  { href: "/analysis", labelEn: "Analysis", labelZh: "分析" },
  { href: "/family", labelEn: "Family", labelZh: "家庭" },
  { href: "/settings", labelEn: "Settings", labelZh: "设置" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center">
      <main className="flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row">
        <section className="flex flex-1 flex-col justify-center gap-4">
          <p className="text-sm font-medium text-blue-500">Cola Finance</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
            One screen for all your assets
          </h1>
          <p className="max-w-xl text-sm text-zinc-600">
            支持多平台持仓聚合、每日快照与家庭组协作，界面风格对齐东方财富、
            天天基金、雪球等主流理财 App。
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              多平台
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              历史走势
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              家庭组
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm"
            >
              进入总览
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 bg-white"
            >
              登录 / 注册
            </Link>
          </div>
        </section>
        <section className="mt-8 flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:mt-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500">总资产</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">
                ￥1,234,567
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">当日收益</p>
              <p className="mt-1 text-sm font-medium text-emerald-600">
                +￥3,210 (+1.23%)
              </p>
            </div>
          </div>
          <div className="mt-2 h-24 rounded-xl bg-gradient-to-tr from-emerald-50 to-sky-50" />
          <div className="mt-2 grid grid-cols-5 gap-2 text-[11px] text-zinc-600">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center rounded-lg bg-zinc-50 px-2 py-1"
              >
                <span className="font-medium text-zinc-800">
                  {item.labelZh}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {item.labelEn}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
