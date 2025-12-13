"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import type { QuestionId } from "../data/questions";
import { useAnswerContext } from "../state/answer-context";
import { getBrowserStorage } from "@/lib/storage";
import { useStreamingResult } from "./useStreamingResult";

const API_ENDPOINT =
  process.env.NEXT_PUBLIC_API_ENDPOINT ?? "http://localhost:8000";

// ローディングバーコンポーネント
const LoadingBar = () => (
  <div className="w-full">
    <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500 animate-pulse"
        style={{ width: '100%' }}
      />
    </div>
    <span className="text-sm text-slate-500 mt-2 block">アドバイスを生成中...</span>
  </div>
);

// 収支予想データ型
type FinancialForecast = {
  monthly_sales: number; // 月商
  rent_budget: number; // 推奨家賃
  cost_of_goods_rate: number; // 原価率（%）
  labor_cost_rate: number; // 人件費率（%）
  profit_margin: number; // 利益率（%）
};

// 即時返却データ型
type ImmediateResult = {
  session_id: number;
  concept_title?: string; // 仮コンセプトタイトル（固定テキスト）
  concept_detail?: string; // 詳細コンセプト（固定テキスト）
  financial_forecast: FinancialForecast; // 収支予想（構造化データ）
  industry_notes: string; // 業界の留意事項・開業における心構え
};

export default function ResultPage() {
  const router = useRouter();
  const { answers, resetAnswers } = useAnswerContext();
  const [immediateData, setImmediateData] = useState<ImmediateResult | null>(null);
  const [immediateLoading, setImmediateLoading] = useState(true);
  const [immediateError, setImmediateError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [guestToken, setGuestToken] = useState<string | null>(null);

  // ゲストトークン生成
  useEffect(() => {
    const storage = getBrowserStorage();
    if (!storage) return;
    const existing = storage.getItem("guest_session_token");
    if (existing) {
      setGuestToken(existing);
      return;
    }
    const token =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    storage.setItem("guest_session_token", token);
    setGuestToken(token);
  }, []);

  const answerPayload = useMemo(
    () =>
      Object.entries(answers).map(([question_code, values]) => ({
        question_code,
        values,
      })),
    [answers],
  );

  // 即時返却API呼び出し
  useEffect(() => {
    const required: QuestionId[] = [
      "main_genre",
      "sub_genre",
      "seats",
      "price_point",
      "business_hours",
      "location",
    ];
    const missing = required.some((key) => !(answers[key]?.length));
    if (missing) {
      router.replace("/");
      return;
    }
    if (!guestToken) return;

    const fetchImmediate = async () => {
      setImmediateLoading(true);
      setImmediateError(null);

      // 即時返却APIエンドポイント（仮）
      // TODO: 実際のエンドポイントに変更する
      const { data, status } = await apiFetch<ImmediateResult>(
        "/simulations/simple/result",
        {
          method: "POST",
          body: { answers: answerPayload, guest_session_token: guestToken },
        }
      );

      if (status === 400) {
        router.replace("/");
        return;
      }

      if (data) {
        console.log("[Result] Received immediate data:", data);
        console.log("[Result] Session ID:", data.session_id);
        console.log("[Result] Session ID type:", typeof data.session_id);
        console.log("[Result] Financial forecast:", data.financial_forecast);
        console.log("[Result] Concept title:", data.concept_title);
        console.log("[Result] Concept detail:", data.concept_detail);
        setImmediateData(data);
      } else {
        setImmediateError(
          status === 401 ? "ログインが必要です" : "結果の取得に失敗しました"
        );
      }
      setImmediateLoading(false);
    };

    fetchImmediate().catch(() => {
      setImmediateError("結果の取得に失敗しました");
      setImmediateLoading(false);
    });
  }, [answerPayload, answers, guestToken, router]);

  // Google認証URL取得
  useEffect(() => {
    const loadAuthUrl = async () => {
      const { data } = await apiFetch<{ auth_url: string }>(
        "/auth/google/url?allow_create=true"
      );
      if (data?.auth_url) {
        setAuthUrl(data.auth_url);
      }
    };
    loadAuthUrl().catch(() => undefined);
  }, []);

  // ストリーミング結果取得（専門家アドバイス）
  const {
    locationAdvice,
    hrAdvice,
    menuAdvice,
    marketingAdvice,
    fundsAdvice,
    isLoadingLocation,
    isLoadingHR,
    isLoadingMenu,
    isLoadingMarketing,
    isLoadingFunds,
    error: streamingError,
  } = useStreamingResult(immediateData?.session_id ?? null, API_ENDPOINT);

  const handleCreateMyPage = () => {
    const storage = getBrowserStorage();
    if (storage) {
      storage.setItem(
        "pending_simple_simulation",
        JSON.stringify({
          answers: answerPayload,
          guest_session_token: guestToken,
        })
      );
    }

    if (authUrl) {
      window.location.href = authUrl;
    } else {
      router.push("/login");
    }
  };

  const handleRestart = () => {
    resetAnswers();
    router.push("/simple_simulation/questions/1");
  };

  return (
    <div className="flex flex-1 flex-col gap-8 py-4">
      {/* ヘッダー */}
      <section>
        <h1 className="text-3xl font-bold text-slate-900">
          診断結果
        </h1>
        <p className="mt-3 text-base text-slate-700">
          簡易シミュレーションの回答にもとづき、仮コンセプトと収支予想を生成しました。
        </p>
      </section>

      {/* ローディング・エラー表示 */}
      {immediateLoading ? (
        <div className="text-slate-700">
          診断結果を計算中です...
        </div>
      ) : immediateError ? (
        <div className="text-rose-600">
          {immediateError}
        </div>
      ) : immediateData ? (
        <>
          {/* コンセプト（固定テキスト） */}
          {(immediateData.concept_title || immediateData.concept_detail) && (
            <section>
              <h2 className="text-xl font-bold text-sky-700 mb-3">
                コンセプト
              </h2>
              {immediateData.concept_title && (
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {immediateData.concept_title}
                </h3>
              )}
              {immediateData.concept_detail && (
                <div className="text-base leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {immediateData.concept_detail}
                </div>
              )}
            </section>
          )}

          {/* 収支予想（表形式） */}
          <section>
            <h2 className="text-xl font-bold text-sky-700 mb-3">
              収支予想
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-sky-50">
                    <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      項目
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      金額・割合
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 px-4 py-3 text-sm text-slate-800">
                      想定月商
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      {immediateData.financial_forecast.monthly_sales.toLocaleString()}円
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-300 px-4 py-3 text-sm text-slate-800">
                      推奨家賃（月商の10%）
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      {immediateData.financial_forecast.rent_budget.toLocaleString()}円
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-4 py-3 text-sm text-slate-800">
                      原価率
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      {immediateData.financial_forecast.cost_of_goods_rate}%
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-300 px-4 py-3 text-sm text-slate-800">
                      人件費率
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      {immediateData.financial_forecast.labor_cost_rate}%
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-4 py-3 text-sm text-slate-800">
                      利益率
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                      {immediateData.financial_forecast.profit_margin}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 業界の留意事項・開業における心構え（固定テキスト） */}
          <section>
            <h2 className="text-xl font-bold text-sky-700 mb-3">
              業界の留意事項・開業における心構え
            </h2>
            <div className="text-base leading-relaxed text-slate-800 whitespace-pre-wrap">
              {immediateData.industry_notes}
            </div>
          </section>

          {/* 専門家からのアドバイス（AIストリーミング） */}
          <section className="mt-12 p-6 bg-slate-50 rounded-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              専門家からのアドバイス
            </h2>

            {/* 立地アドバイス */}
            <div className="mb-6 p-4 bg-white rounded-md shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                【立地】
              </h3>
              <div className="text-base leading-relaxed text-slate-700 min-h-[60px]">
                {isLoadingLocation ? (
                  <LoadingBar />
                ) : (
                  <div className="whitespace-pre-wrap">{locationAdvice}</div>
                )}
              </div>
            </div>

            {/* 人材採用・オペレーション面アドバイス */}
            <div className="mb-6 p-4 bg-white rounded-md shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                【人材採用・オペレーション面】
              </h3>
              <div className="text-base leading-relaxed text-slate-700 min-h-[60px]">
                {isLoadingHR ? (
                  <LoadingBar />
                ) : (
                  <div className="whitespace-pre-wrap">{hrAdvice}</div>
                )}
              </div>
            </div>

            {/* メニューアドバイス */}
            <div className="mb-6 p-4 bg-white rounded-md shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                【メニュー】
              </h3>
              <div className="text-base leading-relaxed text-slate-700 min-h-[60px]">
                {isLoadingMenu ? (
                  <LoadingBar />
                ) : (
                  <div className="whitespace-pre-wrap">{menuAdvice}</div>
                )}
              </div>
            </div>

            {/* 広告戦略アドバイス */}
            <div className="mb-6 p-4 bg-white rounded-md shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                【広告戦略】
              </h3>
              <div className="text-base leading-relaxed text-slate-700 min-h-[60px]">
                {isLoadingMarketing ? (
                  <LoadingBar />
                ) : (
                  <div className="whitespace-pre-wrap">{marketingAdvice}</div>
                )}
              </div>
            </div>

            {/* 資金計画アドバイス */}
            <div className="mb-6 p-4 bg-white rounded-md shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                【資金計画】
              </h3>
              <div className="text-base leading-relaxed text-slate-700 min-h-[60px]">
                {isLoadingFunds ? (
                  <LoadingBar />
                ) : (
                  <div className="whitespace-pre-wrap">{fundsAdvice}</div>
                )}
              </div>
            </div>

            {streamingError && (
              <p className="mt-3 text-sm text-rose-600">{streamingError}</p>
            )}
          </section>
        </>
      ) : null}

      {/* アクションボタン */}
      <section className="mt-auto flex flex-wrap gap-3 pt-4">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          onClick={handleCreateMyPage}
          disabled={immediateLoading}
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
