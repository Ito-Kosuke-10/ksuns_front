"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api-client";

type AxisListItem = {
  code: string;
  name: string;
  description: string;
  steps: {
    level: number;
    code: string;
    title: string;
    description: string;
    display_order: number;
  }[];
};

export default function AxesPage() {
  const [axes, setAxes] = useState<AxisListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, status } = await apiFetch<{ axes: AxisListItem[] }>("/axes");
      if (data) {
        setAxes(data.axes);
      } else {
        setError(status === 401 ? "ログインしてください" : "取得に失敗しました");
      }
    };
    load().catch(() => setError("取得に失敗しました"));
  }, []);

  return (
    <div id="axes-root" className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">8つの項目</h1>
      {error && (
        <div className="rounded-2xl bg-white p-4 text-rose-600 shadow-sm">
          {error}
        </div>
      )}
      <div id="axes-grid" className="grid gap-4 sm:grid-cols-2">
        {axes.map((axis) => (
          <Link
            key={axis.code}
            id={`axes-item-${axis.code}`}
            href={`/axes/${axis.code}`}
            className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{axis.name}</h2>
              <span className="text-xs uppercase text-slate-500">{axis.code}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{axis.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {axis.steps.map((step) => (
                <span
                  key={step.code}
                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  L{step.level}: {step.title}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
