"use client";

import Link from "next/link";

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Report</p>
          <h1 className="text-2xl font-semibold">開業プラン出力（ハリボテ）</h1>
          <p className="text-sm text-slate-600">グラフィカルな開業プラン表示は後続実装です。現状はプレースホルダーです。</p>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
          このページはハリボテです。将来ここに開業プランの可視化を実装します。
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

