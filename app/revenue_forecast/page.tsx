"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageSquare } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";

// カードの進捗ステータス
type RevenueForecastStatus = {
  card_id: string;
  is_completed: boolean;
  summary: string | null;
  chat_history: Array<{ role: string; content: string }> | null;
};

// カードデータ（Backendの定数と一致）
const REVENUE_FORECAST_CARDS = {
  "1": { title: "客単価（昼）", step: 1 },
  "2": { title: "客単価（夜）", step: 1 },
  "3": { title: "席数", step: 1 },
  "4": { title: "原価率目標", step: 1 },
  "5": { title: "営業日数", step: 1 },
  "6": { title: "営業時間（昼）", step: 2 },
  "7": { title: "営業時間（夜）", step: 2 },
  "8": { title: "客席回転率（昼）", step: 2 },
  "9": { title: "客席回転率（夜）", step: 2 },
  "10": { title: "オーナー報酬/役員報酬", step: 2 },
  "11": { title: "社員・人件費（オーナー除く）", step: 3 },
  "12": { title: "家賃（月額）", step: 3 },
  "13": { title: "水道光熱費・通信費", step: 3 },
  "14": { title: "人件費率（目標）", step: 3 },
  "15": { title: "販管費率（目標）", step: 3 },
};

export function RevenueForecastPage({ hideHeader = false, initialCardId }: { hideHeader?: boolean; initialCardId?: string | null }) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<RevenueForecastStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(initialCardId || null);

  useEffect(() => {
    loadStatuses();
  }, []);

  // initialCardIdが変更されたらモーダルを開く
  useEffect(() => {
    if (initialCardId && REVENUE_FORECAST_CARDS[initialCardId as keyof typeof REVENUE_FORECAST_CARDS]) {
      setSelectedCardId(initialCardId);
    }
  }, [initialCardId]);

  const loadStatuses = async () => {
    try {
      const { data, status } = await apiFetch<{ statuses: RevenueForecastStatus[] }>("/api/revenue-forecast/status");
      if (status === 401) {
        clearAccessToken();
        router.replace("/");
        return;
      }
      if (data?.statuses) {
        setStatuses(data.statuses);
      }
    } catch {
      setError("進捗状況の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (cardId: string) => {
    setSelectedCardId(cardId);
  };

  const getCardStatus = (cardId: string): RevenueForecastStatus | undefined => {
    return statuses.find((s) => s.card_id === cardId);
  };

  const handleCloseModal = () => {
    setSelectedCardId(null);
    loadStatuses(); // モーダルを閉じた後に進捗を再取得
  };

  // Stepごとにカードをグループ化
  const cardsByStep = {
    step1: ["1", "2", "3", "4", "5"],
    step2: ["6", "7", "8", "9", "10"],
    step3: ["11", "12", "13", "14", "15"],
  };

  if (loading) {
    return hideHeader ? (
      <Alert>読み込み中...</Alert>
    ) : (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <Container className="py-10">
          <Alert>読み込み中...</Alert>
        </Container>
      </main>
    );
  }

  const content = (
    <>
      {!hideHeader && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">収支予測軸の深掘り質問</h1>
          <p className="mt-2 text-sm text-slate-600">
            各カードをクリックして、AIと対話しながら収支予測の各項目を確定していきましょう。
          </p>
        </div>
      )}

      {error && (
        <Alert variant="error" className={hideHeader ? "mb-6" : "mb-6"}>
          {error}
        </Alert>
      )}

        {/* Step 1 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">STEP 1</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {cardsByStep.step1.map((cardId) => {
              const status = getCardStatus(cardId);
              const card = REVENUE_FORECAST_CARDS[cardId as keyof typeof REVENUE_FORECAST_CARDS];
              const isCompleted = status?.is_completed ?? false;

              return (
                <Card
                  key={cardId}
                  className={`cursor-pointer p-6 transition-all hover:shadow-md ${
                    isCompleted ? "bg-green-50 border-green-200" : ""
                  }`}
                  onClick={() => handleCardClick(cardId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                        {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      </div>
                      {isCompleted && status?.summary && (
                        <p className="mt-3 text-sm text-slate-700">{status.summary}</p>
                      )}
                    </div>
                    <MessageSquare className="h-5 w-5 text-slate-400" />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Step 2 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">STEP 2</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {cardsByStep.step2.map((cardId) => {
              const status = getCardStatus(cardId);
              const card = REVENUE_FORECAST_CARDS[cardId as keyof typeof REVENUE_FORECAST_CARDS];
              const isCompleted = status?.is_completed ?? false;

              return (
                <Card
                  key={cardId}
                  className={`cursor-pointer p-6 transition-all hover:shadow-md ${
                    isCompleted ? "bg-green-50 border-green-200" : ""
                  }`}
                  onClick={() => handleCardClick(cardId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                        {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      </div>
                      {isCompleted && status?.summary && (
                        <p className="mt-3 text-sm text-slate-700">{status.summary}</p>
                      )}
                    </div>
                    <MessageSquare className="h-5 w-5 text-slate-400" />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Step 3 */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">STEP 3</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {cardsByStep.step3.map((cardId) => {
              const status = getCardStatus(cardId);
              const card = REVENUE_FORECAST_CARDS[cardId as keyof typeof REVENUE_FORECAST_CARDS];
              const isCompleted = status?.is_completed ?? false;

              return (
                <Card
                  key={cardId}
                  className={`cursor-pointer p-6 transition-all hover:shadow-md ${
                    isCompleted ? "bg-green-50 border-green-200" : ""
                  }`}
                  onClick={() => handleCardClick(cardId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                        {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      </div>
                      {isCompleted && status?.summary && (
                        <p className="mt-3 text-sm text-slate-700">{status.summary}</p>
                      )}
                    </div>
                    <MessageSquare className="h-5 w-5 text-slate-400" />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
    </>
  );

  return hideHeader ? (
    <>
      {content}
      {/* チャットモーダル */}
      {selectedCardId && (
        <RevenueForecastChatModal 
          cardId={selectedCardId} 
          onClose={handleCloseModal}
          initialHistory={getCardStatus(selectedCardId)?.chat_history || null}
          initialSummary={getCardStatus(selectedCardId)?.summary || null}
        />
      )}
    </>
  ) : (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Container className="py-10">
        {content}
      </Container>

      {/* チャットモーダル */}
      {selectedCardId && (
        <RevenueForecastChatModal 
          cardId={selectedCardId} 
          onClose={handleCloseModal}
          initialHistory={getCardStatus(selectedCardId)?.chat_history || null}
          initialSummary={getCardStatus(selectedCardId)?.summary || null}
        />
      )}
    </main>
  );
}

// チャットモーダルコンポーネント
function RevenueForecastChatModal({ 
  cardId, 
  onClose,
  initialHistory,
  initialSummary,
}: { 
  cardId: string; 
  onClose: () => void;
  initialHistory?: Array<{ role: string; content: string }> | null;
  initialSummary?: string | null;
}) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>(
    []
  );
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(initialSummary || null);
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // チャットエリアの自動スクロール用ref
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // メッセージが追加されたら自動で一番下にスクロール
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // カードの初期質問（Backendの定数と一致）
  const INITIAL_QUESTIONS: Record<string, string> = {
    "1": "【STEP 1/3 - 質問1】ターゲット客層を考慮した昼の客単価を確定しましょう。どのくらいの金額を想定していますか？その根拠も教えてください。",
    "2": "【STEP 1/3 - 質問2】ターゲット客層を考慮した夜の客単価を確定しましょう。どのくらいの金額を想定していますか？その根拠も教えてください。",
    "3": "【STEP 1/3 - 質問3】物件の坪数やコンセプトからみて、客席数を何席と設定しますか？その理由も教えてください。",
    "4": "【STEP 1/3 - 質問4】利益目標を達成するため、食材原価率の目標を何パーセントに設定しますか？業界平均や競合店の情報も参考にしながら考えてみましょう。",
    "5": "【STEP 1/3 - 質問5】無理のない経営と売上目標を両立するため、月の営業日数を何日としますか？スタッフの休みやメンテナンス日も考慮してください。",
    "6": "【STEP 2/3 - 質問6】客単価と立地を考慮し、昼の営業時間は何時から何時までとしますか？ランチタイムの需要や競合店の営業時間も参考にしてください。",
    "7": "【STEP 2/3 - 質問7】客単価と立地を考慮し、夜の営業時間は何時から何時までとしますか？ディナータイムの需要や競合店の営業時間も参考にしてください。",
    "8": "【STEP 2/3 - 質問8】昼の客席回転率を何回転と見込みますか？ランチタイムの長さやメニューの性質、ターゲット客層の滞在時間を考慮して考えてみましょう。",
    "9": "【STEP 2/3 - 質問9】夜の客席回転率を何回転と見込みますか？ディナータイムの長さやメニューの性質、ターゲット客層の滞在時間を考慮して考えてみましょう。",
    "10": "【STEP 2/3 - 質問10】オーナーであるあなた自身の毎月の報酬（人件費）をいくらと設定しますか？生活費や将来の投資も考慮しながら、無理のない金額を設定しましょう。",
    "11": "【STEP 3/3 - 質問11】オーナー以外に社員は何名採用しますか？また、その社員とアルバイトの人件費総額（オーナー報酬除く）はいくらと見込みますか？必要なスキルや経験も考慮してください。",
    "12": "【STEP 3/3 - 質問12】現在検討している物件の月額家賃（共益費等含む固定費）はいくらですか？立地や坪数、設備などを考慮した適正な金額か確認しましょう。",
    "13": "【STEP 3/3 - 質問13】水道光熱費や通信費など、毎月の概算固定経費はいくらと見込みますか？席数や坪数、営業時間を考慮して、現実的な金額を設定しましょう。",
    "14": "【STEP 3/3 - 質問14】最終的な総人件費率（オーナー報酬含む）の目標を何パーセントに設定しますか？業界の適正比率（通常25-35%）を参考にしながら、あなたの店に合った目標を設定しましょう。",
    "15": "【STEP 3/3 - 質問15】その他の販管費率（広告宣伝費、消耗品費など）の目標を何パーセントに設定しますか？業界の適正比率（通常5-10%）を参考にしながら、あなたの店に合った目標を設定しましょう。",
  };

  useEffect(() => {
    // 既存の履歴がある場合はそれを使用、なければ初期質問を表示
    if (initialHistory && initialHistory.length > 0) {
      setMessages(
        initialHistory.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))
      );
    } else {
      const initialQuestion = INITIAL_QUESTIONS[cardId];
      if (initialQuestion) {
        setMessages([{ role: "assistant", content: initialQuestion }]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setLoading(true);
    setError(null);

    // ユーザーメッセージを追加
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);

    try {
      const { data, status } = await apiFetch<{
        assistant_message: string;
        history: Array<{ role: string; content: string }>;
      }>("/api/revenue-forecast/chat", {
        method: "POST",
        body: {
          card_id: cardId,
          user_message: userMessage,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      if (status === 401) {
        clearAccessToken();
        setError("認証エラーが発生しました。再度ログインしてください。");
        return;
      }

      if (!data) {
        setError(`APIエラーが発生しました (ステータス: ${status})。バックエンドのログを確認してください。`);
        console.error("APIレスポンスが空です", { status });
        return;
      }

      if (data.assistant_message) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.assistant_message },
        ]);
      } else {
        setError("AIからの返答が空でした。");
        console.error("assistant_messageが空です", data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "予期しないエラーが発生しました";
      if (errorMessage.includes("接続できません") || errorMessage.includes("Failed to fetch")) {
        setError("バックエンドサーバーに接続できません。バックエンドが起動しているか確認してください。");
      } else {
        setError(errorMessage);
      }
      console.error("チャット送信エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (isSummaryGenerating || messages.length === 0) return;

    setIsSummaryGenerating(true);
    setError(null);
    try {
      const { data, status } = await apiFetch<{ summary: string }>("/api/revenue-forecast/summary", {
        method: "POST",
        body: {
          card_id: cardId,
          chat_history: messages.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      if (status === 401) {
        clearAccessToken();
        setError("認証エラーが発生しました。再度ログインしてください。");
        return;
      }

      if (!data) {
        setError(`サマリー生成エラーが発生しました (ステータス: ${status})`);
        console.error("サマリーAPIレスポンスが空です", { status });
        return;
      }

      if (data.summary) {
        setSummary(data.summary);
      } else {
        setError("サマリーが生成されませんでした。");
        console.error("summaryが空です", data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "予期しないエラーが発生しました";
      if (errorMessage.includes("接続できません") || errorMessage.includes("Failed to fetch")) {
        setError("バックエンドサーバーに接続できません。バックエンドが起動しているか確認してください。");
      } else {
        setError(errorMessage);
      }
      console.error("サマリー生成エラー:", err);
    } finally {
      setIsSummaryGenerating(false);
    }
  };

  const handleComplete = async () => {
    // モーダルを閉じて、リスト画面を更新
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col ring-1 ring-black/5">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">
            {REVENUE_FORECAST_CARDS[cardId as keyof typeof REVENUE_FORECAST_CARDS]?.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* チャットエリア */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-white to-slate-50"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                    : "bg-white text-slate-900 border border-slate-200"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* サマリー表示エリア */}
        {summary && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200">
            <h3 className="mb-2 font-semibold text-green-800 text-sm">サマリー</h3>
            <p className="text-sm text-green-700 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* フッター */}
        <div className="p-4 border-t border-slate-200 space-y-3 bg-white rounded-b-2xl">
          {!summary && (
            <button
              onClick={handleGenerateSummary}
              disabled={isSummaryGenerating || messages.length === 0}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {isSummaryGenerating ? "生成中..." : "AIにサマリー依頼"}
            </button>
          )}
          {summary && (
            <button
              onClick={handleComplete}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
            >
              完了
            </button>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="メッセージを入力..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputMessage.trim()}
              className="px-5 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RevenueForecastPage;

