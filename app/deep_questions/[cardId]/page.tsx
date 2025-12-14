"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";

type DeepDiveChatMessage = {
  role: "user" | "assistant";
  message: string;
  created_at: string;
};

type DeepDiveChatResponse = {
  card_id: string;
  card_title: string;
  initial_question: string;
  messages: DeepDiveChatMessage[];
  status?: string; // カードのステータス（オプショナル）
  summary?: string | null; // カードのサマリー（オプショナル）
};

export default function DeepDiveChatPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-slate-50 text-slate-900">
          <Container className="py-10">
            <Alert>読み込み中...</Alert>
          </Container>
        </main>
      }
    >
      <DeepDiveChatContent />
    </Suspense>
  );
}

function DeepDiveChatContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const cardId = params.cardId as string;
  const axis = searchParams.get("axis");

  const [chatData, setChatData] = useState<DeepDiveChatResponse | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // チャット履歴を取得
  useEffect(() => {
    if (!cardId) return;
    const loadChat = async () => {
      setLoading(true);
      const { data, status } = await apiFetch<DeepDiveChatResponse>(`/deep-dive/chat/${cardId}`);
      if (status === 401) {
        clearAccessToken();
        router.replace("/login");
        return;
      }
      if (data) {
        setChatData(data);
        // 初回アクセスでメッセージがない場合、初期質問を表示
        if (data.messages.length === 0) {
          setInput(data.initial_question);
        }
      } else {
        setError("チャット履歴の取得に失敗しました。");
      }
      setLoading(false);
    };
    loadChat().catch((err) => {
      setError("チャット履歴の取得に失敗しました。");
      console.error("Load chat error:", err);
      setLoading(false);
    });
  }, [cardId, router]);

  const handleSend = async () => {
    if (!input.trim() || !cardId || sending) return;
    setSending(true);
    setError(null);
    try {
      const { data, status } = await apiFetch<DeepDiveChatResponse>(`/deep-dive/chat/${cardId}`, {
        method: "POST",
        body: { message: input.trim() },
      });
      if (status === 401) {
        clearAccessToken();
        router.replace("/login");
        return;
      }
      if (status >= 400) {
        setError(`送信に失敗しました。ステータス: ${status}`);
        console.error("Send error:", { status, data });
        return;
      }
      if (data) {
        setChatData(data);
        setInput("");
      } else {
        setError("送信に失敗しました。時間をおいて再試行してください。");
        console.error("Send error: No data returned");
      }
    } catch (err) {
      setError(`送信に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleComplete = async () => {
    if (!cardId || completing) return;
    setCompleting(true);
    setError(null);
    try {
      const { data, status } = await apiFetch<{
        card_id: string;
        status: string;
        summary: string | null;
      }>(`/deep-dive/card/${cardId}/complete`, {
        method: "POST",
      });
      if (status === 401) {
        clearAccessToken();
        router.replace("/login");
        return;
      }
      if (status >= 400) {
        setError(`完了処理に失敗しました。ステータス: ${status}`);
        console.error("Complete error:", { status, data });
        return;
      }
      if (data) {
        console.log("✅ 完了処理成功:", data);
        console.log(`Status: ${data.status}, Summary: ${data.summary ? 'あり' : 'なし'}`);
        // 要約が生成された場合は表示
        if (data.summary) {
          alert(`カードを完了しました！\n\n【決定事項の要約】\n${data.summary}`);
        } else {
          alert("カードを完了しました！");
        }
        // 一覧ページに戻る（データベースのコミットが完了するのを待つため、少し長めの遅延を入れる）
        // 要約生成が完了しているので、1.5秒待ってから遷移
        setTimeout(() => {
          if (axis) {
            router.push(`/deep_questions?axis=${axis}`);
          } else {
            router.push("/deep_questions");
          }
        }, 1500);
      } else {
        console.error("❌ 完了処理失敗: data is null", { status });
        setError("完了処理に失敗しました。");
      }
    } catch (err) {
      setError("完了処理中にエラーが発生しました。");
      console.error("Complete error:", err);
    } finally {
      setCompleting(false);
    }
  };

  const messages = useMemo(() => chatData?.messages ?? [], [chatData]);
  const hasMessages = messages.length > 0;
  const isCompleted = messages.some(
    (msg) => msg.role === "assistant" && msg.message.includes("完了")
  );

  return (
    <main id="deep-dive-chat-root" className="bg-slate-50 text-slate-900">
      <Container id="deep-dive-chat-container" className="flex flex-col gap-6 py-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="px-3 py-2 text-xs"
              onClick={() => router.push(`/deep_questions${axis ? `?axis=${axis}` : ""}`)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              一覧へ戻る
            </Button>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Deep Dive Chat
            </p>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {chatData?.card_title ?? "深掘りチャット"}
          </h1>
          {chatData?.initial_question && (
            <p className="text-sm text-slate-600">{chatData.initial_question}</p>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {loading && <Alert>読み込み中...</Alert>}

        {!loading && chatData && (
          <Card className="flex flex-col gap-4 p-4">
            {/* チャット履歴 */}
            <div className="flex flex-col gap-3 min-h-[400px] max-h-[600px] overflow-y-auto">
              {!hasMessages && (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-slate-500">
                    最初の質問を送信して、深掘りを始めましょう。
                  </p>
                </div>
              )}
              {hasMessages && (
                <>
                  {messages.map((msg, index) => (
                    <div
                      key={`${msg.created_at}-${index}`}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          msg.role === "user"
                            ? "bg-sky-600 text-white"
                            : "bg-white text-slate-800 border border-slate-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-6">{msg.message}</p>
                        <p
                          className={`mt-1 text-[11px] ${
                            msg.role === "user" ? "text-sky-100" : "text-slate-500"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* 入力エリア */}
            <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-3">
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSend();
                  }
                }}
                placeholder="質問を入力してください（Cmd/Ctrl + Enter で送信）"
                disabled={sending}
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="secondary"
                  onClick={handleComplete}
                  className="px-4 py-2 bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                  disabled={!hasMessages || sending || completing}
                >
                  {completing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      完了処理中...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      決定する（完了）
                    </span>
                  )}
                </Button>
                <Button
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
      </Container>
    </main>
  );
}
