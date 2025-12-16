"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageSquare } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";

// カードの進捗ステータス
type InteriorExteriorStatus = {
  card_id: string;
  is_completed: boolean;
  summary: string | null;
  chat_history: Array<{ role: string; content: string }> | null;
};

// カードデータ（Backendの定数と一致）
const INTERIOR_EXTERIOR_CARDS = {
  "1": { title: "デザインテーマ", step: 1 },
  "2": { title: "キーカラー・素材", step: 1 },
  "3": { title: "ファサード（外観）の在り方", step: 1 },
  "4": { title: "ゾーニング（配置）", step: 1 },
  "5": { title: "厨房機器・レイアウト", step: 2 },
  "6": { title: "照明の雰囲気", step: 2 },
  "7": { title: "家具・什器の調達", step: 2 },
  "8": { title: "看板・サイン計画", step: 2 },
  "9": { title: "予算配分（メリハリ）", step: 3 },
  "10": { title: "施工業者の選定方針", step: 3 },
  "11": { title: "参考イメージの保存", step: 3 },
  "12": { title: "デザイン要望書の完成", step: 3 },
};

export function InteriorExteriorPage({ hideHeader = false, initialCardId }: { hideHeader?: boolean; initialCardId?: string | null }) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<InteriorExteriorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(initialCardId || null);

  useEffect(() => {
    loadStatuses();
  }, []);

  // initialCardIdが変更されたらモーダルを開く
  useEffect(() => {
    if (initialCardId && INTERIOR_EXTERIOR_CARDS[initialCardId as keyof typeof INTERIOR_EXTERIOR_CARDS]) {
      setSelectedCardId(initialCardId);
    }
  }, [initialCardId]);

  const loadStatuses = async () => {
    try {
      const { data, status } = await apiFetch<{ statuses: InteriorExteriorStatus[] }>("/api/interior-exterior/status");
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

  const getCardStatus = (cardId: string): InteriorExteriorStatus | undefined => {
    return statuses.find((s) => s.card_id === cardId);
  };

  const handleCloseModal = () => {
    setSelectedCardId(null);
    loadStatuses(); // モーダルを閉じた後に進捗を再取得
  };

  // Stepごとにカードをグループ化
  const cardsByStep = {
    step1: ["1", "2", "3", "4"],
    step2: ["5", "6", "7", "8"],
    step3: ["9", "10", "11", "12"],
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
          <h1 className="text-2xl font-bold text-slate-900">内装外装軸の深掘り質問</h1>
          <p className="mt-2 text-sm text-slate-600">
            各カードをクリックして、AIと対話しながら内装外装の各項目を確定していきましょう。
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
              const card = INTERIOR_EXTERIOR_CARDS[cardId as keyof typeof INTERIOR_EXTERIOR_CARDS];
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
              const card = INTERIOR_EXTERIOR_CARDS[cardId as keyof typeof INTERIOR_EXTERIOR_CARDS];
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
              const card = INTERIOR_EXTERIOR_CARDS[cardId as keyof typeof INTERIOR_EXTERIOR_CARDS];
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
        <InteriorExteriorChatModal 
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
        <InteriorExteriorChatModal 
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
function InteriorExteriorChatModal({ 
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

  // カードの初期質問（Backendの定数と一致）
  const INITIAL_QUESTIONS: Record<string, string> = {
    "1": "【STEP 1/3 - 質問1】お店の世界観を表すデザインのキーワードを決めてください。和モダン、インダストリアル、北欧風など、どのようなスタイルを目指しますか？その理由も教えてください。",
    "2": "【STEP 1/3 - 質問2】お店のテーマカラー（キーカラー）と、主に使用したい素材（木材、コンクリート、タイルなど）を決定してください。コンセプトとの整合性も考えてみましょう。",
    "3": "【STEP 1/3 - 質問3】お客様が最初に見る外観は、中が見える「開放的」な作りですか？それとも「隠れ家」的なクローズドな作りですか？その理由も教えてください。",
    "4": "【STEP 1/3 - 質問4】オペレーション軸で決めた接客スタイルに基づき、厨房と客席の配置（ゾーニング）の大枠を決定してください。カウンターメインでライブ感を出すか、個室重視でプライベート感を出すかなど、具体的に考えてみましょう。",
    "5": "【STEP 2/3 - 質問5】メニュー軸の調理工程に基づき、必須となる厨房機器（強力な火力、ピザ釜など）と、その配置の優先順位をリストアップしてください。",
    "6": "【STEP 2/3 - 質問6】お店の雰囲気を決定づける照明について決めましょう。全体を明るくしますか？それともテーブル上のスポットライトでムードを作りますか？",
    "7": "【STEP 2/3 - 質問7】客席のテーブルや椅子の調達方針を決めてください。新品購入、中古・アンティーク活用、造作/オーダーメイドなど、どの方法を選びますか？",
    "8": "【STEP 2/3 - 質問8】店名ロゴやメニューを表示する看板は、どこに設置し、何をアピールしますか？遠くからの視認性重視か、入店直前のメニュー訴求重視か、考えてみましょう。",
    "9": "【STEP 3/3 - 質問9】予算内で理想を実現するために、お金をかける場所（こだわり）と、節約する場所（妥協点）を明確に分けてください。客席は豪華に、厨房やトイレは標準仕様でなど、具体的に考えてみましょう。",
    "10": "【STEP 3/3 - 質問10】内装工事は、デザイン設計と施工を分ける「設計施工分離」にしますか？一括で頼める「設計施工一貫」にしますか？それぞれのメリット・デメリットも考慮してください。",
    "11": "【STEP 3/3 - 質問11】あなたのイメージに近い他店の写真やWebサイトのURLがあれば、ここにメモして、「どの部分が気に入っているか」（例：床の色、照明の形）を具体的に書き残してください。",
    "12": "【STEP 3/3 - 質問12】これまでの決定事項を統合し、内装業者に渡すための「デザイン要望書（テキスト）」としてまとめます。内容に漏れや矛盾がないか最終確認してください。",
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
      }>("/api/interior-exterior/chat", {
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
      const { data, status } = await apiFetch<{ summary: string }>("/api/interior-exterior/summary", {
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
            {INTERIOR_EXTERIOR_CARDS[cardId as keyof typeof INTERIOR_EXTERIOR_CARDS]?.title}
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
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-white to-slate-50">
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

export default InteriorExteriorPage;

