"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api-client";

type AxisDetail = {
  code: string;
  name: string;
  score: number;
  answers: Record<string, any>;
  feedback: string;
};

type Props = {
  params: { axisCode: string };
};

export default function AxisDetailPage({ params }: Props) {
  const [data, setData] = useState<AxisDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, status } = await apiFetch<AxisDetail>(
        `/axes/${params.axisCode}`,
      );
      if (data) {
        setData(data);
      } else {
        setError(status === 401 ? "ログインしてください" : "取得に失敗しました");
      }
    };
    load().catch(() => setError("取得に失敗しました"));
  }, [params.axisCode]);

  const handleSaveLevel = async (level: number) => {
    setSaving(true);
    const answers = data?.answers || {};
    const payload = {
      level,
      answers: answers[`level_${level}`] ?? {},
    };
    const { data: updated, status } = await apiFetch<AxisDetail>(
      `/axes/${params.axisCode}/answers`,
      { method: "PUT", body: payload },
    );
    if (updated) {
      setData(updated);
    } else {
      setError(status === 401 ? "ログインしてください" : "保存に失敗しました");
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        {data ? data.name : "読み込み中..."}
      </h1>
      {error && (
        <div className="rounded-2xl bg-white p-4 text-rose-600 shadow-sm">
          {error}
        </div>
      )}
      {data && (
        <>
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase text-slate-500">{data.code}</p>
              <p className="text-lg font-semibold text-slate-900">
                スコア: {data.score.toFixed(1)}
              </p>
            </div>
            <p className="mt-2 text-sm text-slate-700">{data.feedback}</p>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">回答（Level 1/2）</h2>
            <div className="mt-3 space-y-3 text-sm text-slate-800">
              {Object.entries(data.answers).map(([levelKey, value]) => (
                <div key={levelKey} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {levelKey}
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap break-words text-slate-800">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveLevel(1)}
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60"
              >
                レベル1を保存
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveLevel(2)}
                className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60"
              >
                レベル2を保存
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
