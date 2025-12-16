"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Send, Sparkles } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";
import { ConceptPage } from "@/app/concept/page";
import { RevenueForecastPage } from "@/app/revenue_forecast/page";
import { FundingPlanPage } from "@/app/funding_plan/page";
import { OperationPage } from "@/app/operation/page";
import { LocationPage } from "@/app/location/page";
import { InteriorExteriorPage } from "@/app/interior_exterior/page";
import { MarketingPage } from "@/app/marketing/page";
import { MenuPage } from "@/app/menu/page";

type AxisOption = {
  code: string;
  name: string;
};

type AxisListResponse = {
  axes: Array<{
    code: string;
    name: string;
  }>;
};

type DeepMessage = {
  role: "user" | "assistant";
  text: string;
  created_at: string;
};

type DeepThread = {
  axis_code: string;
  axis_name: string;
  messages: DeepMessage[];
};

export default function DeepQuestionsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-r from-white to-[#dae4ff] text-slate-900">
          <Container className="py-10">
            <Alert>読み込み中...</Alert>
          </Container>
        </main>
      }
    >
      <DeepQuestionsContent />
    </Suspense>
  );
}

function DeepQuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedAxisParam = searchParams.get("axis");
  const nodeIdParam = searchParams.get("nodeId"); // マインドマップからの遷移時に使用
  const cardIdParam = searchParams.get("cardId"); // マインドマップからの遷移時にチャットモーダルを開く
  const [axes, setAxes] = useState<AxisOption[]>([]);
  const [selectedAxis, setSelectedAxis] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodeIdParam);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(cardIdParam);
  const [thread, setThread] = useState<DeepThread | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // バックエンドのcodeをフロントエンドのcodeにマッピング
  const BACKEND_TO_FRONTEND_CODE_MAP: Record<string, string> = {
    concept: "concept",
    revenue_forecast: "revenue_forecast",
    funds: "funding_plan", // バックエンドのfundsはフロントエンドのfunding_planに対応
    location: "location",
    interior_exterior: "interior_exterior",
    menu: "menu",
    operation: "operation",
    marketing: "marketing",
    // 旧コード名との互換性
    compliance: "funding_plan",
    equipment: "interior_exterior",
  };

  // バックエンドのnameからフロントエンドのcodeにマッピング（nameが確実な場合）
  const NAME_TO_FRONTEND_CODE_MAP: Record<string, string> = {
    "コンセプト": "concept",
    "収支予測": "revenue_forecast",
    "資金計画": "funding_plan",
    "立地": "location",
    "内装外装": "interior_exterior",
    "メニュー": "menu",
    "オペレーション": "operation",
    "販促": "marketing",
    // 旧名称との互換性
    "集客": "marketing",
    "設備": "interior_exterior",
  };

  // URLパラメータのaxisをフロントエンドのcodeに変換
  const normalizeAxisCode = useCallback((code: string | null): string | null => {
    if (!code) return null;
    return BACKEND_TO_FRONTEND_CODE_MAP[code] || code;
  }, []);

  useEffect(() => {
    const loadAxes = async () => {
      const { data, status } = await apiFetch<AxisListResponse>("/axes");
      if (status === 401) {
        clearAccessToken();
        router.replace("/login");
        return;
      }
      if (data?.axes?.length) {
        // nameから正しいフロントエンドのcodeを決定（nameが確実な場合）
        const options = data.axes.map((a) => {
          // まずnameからマッピングを試みる（nameが確実なため優先）
          const nameBasedCode = NAME_TO_FRONTEND_CODE_MAP[a.name];
          if (nameBasedCode) {
            // nameベースのマッピングが見つかった場合はそれを使用
            return { 
              code: nameBasedCode, 
              name: a.name 
            };
          }
          // nameベースのマッピングがない場合は、codeを変換
          const codeBasedCode = normalizeAxisCode(a.code);
          // 優先順位: nameベース > codeベース > 元のcode
          const finalCode = codeBasedCode || a.code;
          return { 
            code: finalCode, 
            name: a.name 
          };
        });
        setAxes(options);
        const axisParam = searchParams.get("axis");
        const normalizedParam = normalizeAxisCode(axisParam);
        // nameベースのマッピングも試みる
        const nameBasedParam = axisParam ? NAME_TO_FRONTEND_CODE_MAP[axisParam] : null;
        const finalParam = nameBasedParam || normalizedParam;
        const initial = finalParam || (options[0] ? options[0].code : null);
        if (initial) {
          setSelectedAxis(initial);
          // URLパラメータがバックエンドのcodeやnameの場合は、フロントエンドのcodeに更新
          if (axisParam && axisParam !== initial && finalParam) {
            router.replace(`/deep_questions?axis=${finalParam}`, { scroll: false });
          }
        }
      } else {
        setError("軸の取得に失敗しました。時間をおいて再試行してください。");
      }
      setLoading(false);
    };
    loadAxes().catch(() => {
      setError("軸の取得に失敗しました。時間をおいて再試行してください。");
      setLoading(false);
    });
  }, [router, searchParams, normalizeAxisCode]);

  // URLパラメータのaxisが変更されたときにselectedAxisを更新
  const axisParam = useMemo(() => {
    const param = searchParams.get("axis");
    // バックエンドのcodeをフロントエンドのcodeに変換
    return normalizeAxisCode(param);
  }, [searchParams, normalizeAxisCode]);
  
  useEffect(() => {
    if (axisParam) {
      // URLパラメータが存在する場合は、それに合わせてselectedAxisを更新
      if (axisParam !== selectedAxis) {
        setSelectedAxis(axisParam);
        // URLも正しいcodeに更新（バックエンドのcodeが来た場合）
        const originalParam = searchParams.get("axis");
        if (originalParam && originalParam !== axisParam) {
          router.replace(`/deep_questions?axis=${axisParam}`, { scroll: false });
        }
      }
    } else if (axes.length > 0) {
      // axisパラメータがない場合は最初の軸を選択してURLを更新
      const firstAxis = normalizeAxisCode(axes[0].code) || axes[0].code;
      if (firstAxis !== selectedAxis) {
        setSelectedAxis(firstAxis);
        router.replace(`/deep_questions?axis=${firstAxis}`, { scroll: false });
      }
    }
  }, [axisParam, axes, selectedAxis, router, searchParams]);

  // nodeIdパラメータの同期
  useEffect(() => {
    const nodeId = searchParams.get("nodeId");
    if (nodeId !== selectedNodeId) {
      setSelectedNodeId(nodeId);
    }
  }, [searchParams, selectedNodeId]);

  // cardIdパラメータの同期（マインドマップからの遷移時にチャットモーダルを開く）
  useEffect(() => {
    const cardId = searchParams.get("cardId");
    if (cardId !== selectedCardId) {
      setSelectedCardId(cardId);
    }
  }, [searchParams, selectedCardId]);

  useEffect(() => {
    if (!selectedAxis) return;
    const loadThread = async () => {
      // nodeIdがある場合はクエリに含める
      const url = selectedNodeId
        ? `/deep_questions?axis=${selectedAxis}&node_id=${encodeURIComponent(selectedNodeId)}`
        : `/deep_questions?axis=${selectedAxis}`;
      const { data, status } = await apiFetch<DeepThread>(url);
      if (status === 401) {
        clearAccessToken();
        router.replace("/login");
        return;
      }
      if (data) {
        setThread(data);
      } else {
        setError("深掘り履歴の取得に失敗しました。");
      }
    };
    loadThread().catch(() => setError("深掘り履歴の取得に失敗しました。"));
  }, [router, selectedAxis, selectedNodeId]);

  const handleSend = async () => {
    if (!input.trim() || !selectedAxis) return;
    setSending(true);

    // nodeIdがある場合はbodyに含める（マインドマップ連携）
    const requestBody: {
      axis_code: string;
      question: string;
      node_id?: string;
    } = {
      axis_code: selectedAxis,
      question: input,
    };

    if (selectedNodeId) {
      requestBody.node_id = selectedNodeId;
    }

    const { data, status } = await apiFetch<DeepThread>("/deep_questions/messages", {
      method: "POST",
      body: requestBody,
    });
    if (status === 401) {
      clearAccessToken();
      router.replace("/login");
      return;
    }
    if (data) {
      setThread(data);
      setInput("");
    } else {
      setError("送信に失敗しました。時間をおいて再試行してください。");
    }
    setSending(false);
  };

  const messages = useMemo(() => thread?.messages ?? [], [thread]);

  return (
    <main id="deep-questions-root" className="min-h-screen bg-gradient-to-r from-white to-[#dae4ff] text-slate-900">
      <Container id="deep-questions-container" className="flex flex-col gap-6 py-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="px-3 py-2 text-xs"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              マイページへ戻る
            </Button>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deep Questions</p>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">不足している軸を深掘りする</h1>
          <p className="text-sm text-slate-600">
            軸を選んで質問すると、AI が次の一歩を返します。必要に応じて何度でも聞き返せます。
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {loading && <Alert>読み込み中...</Alert>}

        {!loading && (
          <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-3 p-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                対象軸を選択
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  value={selectedAxis ?? ""}
                  onChange={(e) => {
                    const newAxis = e.target.value;
                    setSelectedAxis(newAxis);
                    router.push(`/deep_questions?axis=${newAxis}`);
                  }}
                >
                  {axes.map((axis) => (
                    <option key={axis.code} value={axis.code}>
                      {axis.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  className="px-4 py-2"
                  onClick={() => router.push(`/dashboard${selectedAxis ? `?axis=${selectedAxis}` : ""}`)}
                >
                  レーダーを更新する
                </Button>
              </div>

              {/* nodeIdが指定されている場合は表示 */}
              {selectedNodeId && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xs font-semibold text-amber-700">
                    対象カード: {selectedNodeId}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedNodeId(null);
                      router.replace(`/deep_questions?axis=${selectedAxis}`, { scroll: false });
                    }}
                    className="text-xs text-amber-600 hover:text-amber-800 underline"
                  >
                    解除
                  </button>
                </div>
              )}
            </Card>

            {/* axis=concept の場合は ConceptPage のコンテンツを表示 */}
            {/* axis=revenue_forecast の場合は RevenueForecastPage のコンテンツを表示 */}
            {/* axis=funding_plan の場合は FundingPlanPage のコンテンツを表示 */}
            {/* axis=operation の場合は OperationPage のコンテンツを表示 */}
            {/* axis=location の場合は LocationPage のコンテンツを表示 */}
            {/* axis=interior_exterior の場合は InteriorExteriorPage のコンテンツを表示 */}
            {/* axis=marketing の場合は MarketingPage のコンテンツを表示 */}
            {/* axis=menu の場合は MenuPage のコンテンツを表示 */}
            {selectedAxis === "concept" ? (
              <ConceptPage hideHeader={true} initialCardId={selectedCardId} />
            ) : selectedAxis === "revenue_forecast" ? (
              <RevenueForecastPage hideHeader={true} initialCardId={selectedCardId} />
            ) : selectedAxis === "funding_plan" ? (
              <FundingPlanPage hideHeader={true} initialCardId={selectedCardId} />
            ) : selectedAxis === "operation" ? (
              <OperationPage hideHeader={true} initialCardId={selectedCardId} />
            ) : selectedAxis === "location" ? (
              <LocationPage hideHeader={true} initialCardId={selectedCardId} />
            ) : selectedAxis === "interior_exterior" ? (
              <InteriorExteriorPage hideHeader={true} initialCardId={selectedCardId} />
            ) : selectedAxis === "marketing" ? (
              <MarketingPage hideHeader={true} initialCardId={selectedCardId} />
            ) : selectedAxis === "menu" ? (
              <MenuPage hideHeader={true} initialCardId={selectedCardId} />
            ) : (
              <Card className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {thread?.axis_code ?? ""}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {thread?.axis_name ?? "選択した軸"}
                  </h2>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {messages.length === 0 && (
                  <p className="text-sm text-slate-500">まだメッセージがありません。最初の質問を送信してください。</p>
                )}
                {messages.map((msg, index) => (
                  <div
                    key={`${msg.created_at}-${index}`}
                    className={`max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      msg.role === "user"
                        ? "self-end bg-sky-600 text-white"
                        : "self-start bg-white text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-6">{msg.text}</p>
                    <p className={`mt-1 text-[11px] ${msg.role === "user" ? "text-sky-100" : "text-slate-500"}`}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div id="deep-questions-input-card" className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-3">
                <textarea
                  id="deep-questions-input"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  rows={3}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="この軸について詳しく知りたいことを書いてください"
                />
                <div className="flex justify-end">
                  <Button
                    id="deep-questions-send-button"
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="px-4 py-2"
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        送信中...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        送信
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
            )}
          </div>
        )}
      </Container>
    </main>
  );
}
