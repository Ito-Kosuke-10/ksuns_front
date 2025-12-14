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
type MenuStatus = {
  card_id: string;
  is_completed: boolean;
  summary: string | null;
  chat_history: Array<{ role: string; content: string }> | null;
};

// カードデータ（Backendの定数と一致）
const MENU_CARDS = {
  "1": { title: "看板メニュー（スペシャリティ）", step: 1 },
  "2": { title: "メニュー構成比", step: 1 },
  "3": { title: "品数とカテゴリー", step: 1 },
  "4": { title: "価格帯（プライスゾーン）", step: 1 },
  "5": { title: "仕入れ・こだわり食材", step: 2 },
  "6": { title: "原価率設定（メニュー別）", step: 2 },
  "7": { title: "ドリンク戦略", step: 2 },
  "8": { title: "季節性・更新頻度", step: 2 },
  "9": { title: "調理効率（オペレーション）", step: 3 },
  "10": { title: "厨房機器との整合性", step: 3 },
  "11": { title: "メニューブック構成", step: 3 },
  "12": { title: "AI模擬来店（最終確認）", step: 3 },
};

export function MenuPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<MenuStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      const { data, status } = await apiFetch<{ statuses: MenuStatus[] }>("/api/menu/status");
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

  const getCardStatus = (cardId: string): MenuStatus | undefined => {
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
          <h1 className="text-2xl font-bold text-slate-900">メニュー軸の深掘り質問</h1>
          <p className="mt-2 text-sm text-slate-600">
            各カードをクリックして、AIと対話しながらメニューの各項目を確定していきましょう。
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
              const card = MENU_CARDS[cardId as keyof typeof MENU_CARDS];
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
              const card = MENU_CARDS[cardId as keyof typeof MENU_CARDS];
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
              const card = MENU_CARDS[cardId as keyof typeof MENU_CARDS];
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
        <MenuChatModal 
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
        <MenuChatModal 
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
function MenuChatModal({ 
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
    "1": "【STEP 1/3 - 質問1】お店の顔となる「看板メニュー」を1つ決定してください。お客様が「これを食べに来る」と言える強力な商品は何ですか？その理由も教えてください。",
    "2": "【STEP 1/3 - 質問2】売上の構成比として、フードとドリンクの割合をどう想定しますか？（例: フード7:ドリンク3、食事メインのお店）",
    "3": "【STEP 1/3 - 質問3】メニューのカテゴリー（前菜、メイン、〆、デザートなど）と、それぞれの概算の品数を決めてください。品数は多すぎませんか？オペレーション負荷も考慮して考えてみましょう。",
    "4": "【STEP 1/3 - 質問4】看板メニューや中心となる商品の価格帯を決定してください。収支予測で決めた客単価と整合していますか？",
    "5": "【STEP 2/3 - 質問5】メニューの核となる主要食材（肉、魚、野菜など）の仕入れルートやこだわりを明確にしてください。（例: 産地直送、市場仕入れ）",
    "6": "【STEP 2/3 - 質問6】看板メニューは原価をかけて集客し、サイドメニューで利益を取るなど、メニューごとの原価率のメリハリをどうつけますか？「ミックス原価」の考え方を参考にしてみましょう。",
    "7": "【STEP 2/3 - 質問7】利益率の高いドリンクメニューの戦略を立ててください。何に力を入れますか？（例: こだわりのクラフトビール、自家製サワー、厳選ワイン）",
    "8": "【STEP 2/3 - 質問8】メニューは固定ですか？それとも日替わり・週替わり・季節替わりを取り入れますか？その更新頻度はオペレーション的に可能ですか？",
    "9": "【STEP 3/3 - 質問9】オペレーション軸で決めた人員体制で回せるように、「注文を受けてから作るもの」と「事前に仕込んでおくもの（すぐ出る）」のバランスを決定してください。",
    "10": "【STEP 3/3 - 質問10】決定したメニューを調理するために必要な厨房機器は、内装・外装軸でリストアップしたものと合致していますか？足りない機器や不要な機器はありませんか？",
    "11": "【STEP 3/3 - 質問11】お客様が注文しやすいメニューブック（またはモバイルオーダー画面）の構成を文字で設計してください。一番売りたい商品をどこに配置しますか？",
    "12": "【STEP 3/3 - 質問12】これまでのメニュー構成で、仮想のお客様として注文を行います。客単価と原価率が目標通りに着地するか、シミュレーションしましょう。",
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
      }>("/api/menu/chat", {
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
      const { data, status } = await apiFetch<{ summary: string }>("/api/menu/summary", {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900">
            {MENU_CARDS[cardId as keyof typeof MENU_CARDS]?.title}
          </h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* チャットエリア */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-lg p-3">考え中...</div>
            </div>
          )}
        </div>

        {/* サマリー表示エリア */}
        {summary && (
          <div className="p-4 bg-green-50 border-t">
            <h3 className="mb-2 font-semibold text-slate-900">サマリー</h3>
            <p className="text-sm text-slate-700">{summary}</p>
          </div>
        )}

        {/* フッター */}
        <div className="p-4 border-t space-y-2">
          {!summary && (
            <Button
              onClick={handleGenerateSummary}
              disabled={isSummaryGenerating || messages.length === 0}
              className="w-full"
            >
              {isSummaryGenerating ? "生成中..." : "AIにサマリー依頼"}
            </Button>
          )}
          {summary && (
            <Button variant="secondary" onClick={handleComplete} className="w-full bg-green-600 hover:bg-green-700">
              完了
            </Button>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="メッセージを入力..."
              className="flex-1 px-3 py-2 border rounded-md"
              disabled={loading}
            />
            <Button variant="secondary" onClick={handleSendMessage} disabled={loading || !inputMessage.trim()}>
              送信
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuPage;

