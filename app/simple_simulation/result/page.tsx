"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api-client";
import { useAnswerContext } from "../state/answer-context";

type SimulationResult = {
  session_id: number;
  concept_one_liner?: string;
  concept_detail?: string;
  funds_comment_text?: string;
  axis_scores?: Record<string, number>;
};

export default function ResultPage() {
  const router = useRouter();
  const { answers, resetAnswers } = useAnswerContext();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const answerPayload = useMemo(
    () =>
      Object.entries(answers).map(([question_code, values]) => ({
        question_code,
        values,
      })),
    [answers],
  );

  useEffect(() => {
    const submit = async () => {
      setLoading(true);
      setError(null);
      const { data, status } = await apiFetch<SimulationResult>("/simulations/simple/result", {
        method: "POST",
        body: { answers: answerPayload },
      });

      if (data) {
        setResult(data);
      } else {
        setError(status === 401 ? "ログインが必要です" : "結果の取得に失敗しました");
      }
      setLoading(false);
    };

    submit().catch(() => {
      setError("結果の取得に失敗しました");
      setLoading(false);
    });
  }, [answerPayload]);

  useEffect(() => {
    const loadAuthUrl = async () => {
      const { data } = await apiFetch<{ auth_url: string }>("/auth/google/url?allow_create=true");
      if (data?.auth_url) {
        setAuthUrl(data.auth_url);
      }
    };
    loadAuthUrl().catch(() => undefined);
  }, []);

  const handleRestart = () => {
    resetAnswers();
    router.push("/simple_simulation/questions/1");
  };

  const conceptOneLiner =
    result?.concept_one_liner || result?.concept_detail?.split("\n")[0] || "仮コンセプトを生成中です";
  const conceptDetail =
    result?.concept_detail || result?.concept_one_liner || "簡易シミュレーションの回答をもとに仮コンセプトを生成します。";
  const fundsSummary =
    result?.funds_comment_text || "客単価・席数・営業時間から、ざっくりと収支の注意点を提示します。";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold leading-8 text-slate-900">診断結果</h1>
        <p className="mt-2 text-sm text-slate-600">
          簡易シミュレーションの回答にもとづき、仮コンセプトと収支の示唆を生成しました。
        </p>
      </section>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-slate-700">計算中です...</div>
      ) : error ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-rose-600">{error}</div>
      ) : result ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">仮コンセプト</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{conceptOneLiner}</h2>
            <p className="mt-3 text-base leading-7 text-slate-800">{conceptDetail}</p>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">簡易収支の示唆</p>
            <p className="mt-2 text-base leading-7 text-slate-800">{fundsSummary}</p>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">次のステップ</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>・ログインしてマイページを作成すると、この結果が保存されます。</li>
              <li>・マイページで詳細質問や深掘り質問を続けて、開業準備度を高めましょう。</li>
            </ul>
          </article>
        </section>
      ) : null}

      <section className="mt-auto flex flex-wrap gap-3 pt-4">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          onClick={() => {
            if (authUrl) {
              window.location.href = authUrl;
            } else {
              router.push("/login");
            }
          }}
        >
          この結果でマイページを作成する
        </button>
        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          もう一度診断する
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          今回は登録せず終える
        </button>
      </section>
    </div>
  );
}
