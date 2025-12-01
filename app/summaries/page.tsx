"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiFetch } from "@/lib/api-client";

type SummaryResponse = {
  summary_type: string;
  content: string;
  created_at: string;
};

const SUMMARY_TYPES = [
  { code: "family", label: "家族向け" },
  { code: "staff", label: "従業員向け" },
  { code: "bank", label: "銀行向け" },
  { code: "public", label: "公的機関向け" },
];

export default function SummariesPage() {
  return (
    <Suspense fallback={<div className="rounded-2xl bg-white p-4 text-slate-700 shadow-sm">Loading...</div>}>
      <SummariesContent />
    </Suspense>
  );
}

function SummariesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type && SUMMARY_TYPES.some((t) => t.code === type)) {
      setSelected(type);
      handleGenerate(type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleGenerate = async (type: string) => {
    setSelected(type);
    setLoading(true);
    setError(null);
    const { data, status } = await apiFetch<SummaryResponse>("/summaries", {
      method: "POST",
      body: { summary_type: type },
    });
    if (status === 401) {
      setError("ログインしてください");
      setLoading(false);
      router.replace("/login");
      return;
    }
    if (data) {
      setResult(data);
    } else {
      setError("生成に失敗しました");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">サマリー生成</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {SUMMARY_TYPES.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => handleGenerate(item.code)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              selected === item.code
                ? "border-sky-500 bg-sky-50 text-sky-900"
                : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="rounded-2xl bg-white p-4 text-slate-700 shadow-sm">生成中です...</div>
      )}
      {error && (
        <div className="rounded-2xl bg-white p-4 text-rose-600 shadow-sm">{error}</div>
      )}
      {result && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
              {SUMMARY_TYPES.find((t) => t.code === result.summary_type)?.label ?? result.summary_type}
            </p>
            <p className="text-xs text-slate-500">{new Date(result.created_at).toLocaleString()}</p>
          </div>
          <pre className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-800">
            {result.content}
          </pre>
        </section>
      )}
    </div>
  );
}
