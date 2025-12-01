"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Send, Sparkles } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";

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
        <main className="bg-slate-50 text-slate-900">
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
  const [axes, setAxes] = useState<AxisOption[]>([]);
  const [selectedAxis, setSelectedAxis] = useState<string | null>(null);
  const [thread, setThread] = useState<DeepThread | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAxes = async () => {
      const { data, status } = await apiFetch<AxisListResponse>("/axes");
      if (status === 401) {
        clearAccessToken();
        router.replace("/login");
        return;
      }
      if (data?.axes?.length) {
        const options = data.axes.map((a) => ({ code: a.code, name: a.name }));
        setAxes(options);
        const initial = searchParams.get("axis") || options[0].code;
        setSelectedAxis(initial);
      } else {
        setError("軸の取得に失敗しました。時間をおいて再試行してください。");
      }
      setLoading(false);
    };
    loadAxes().catch(() => {
      setError("軸の取得に失敗しました。時間をおいて再試行してください。");
      setLoading(false);
    });
  }, [router, searchParams]);

  useEffect(() => {
    if (!selectedAxis) return;
    const loadThread = async () => {
      const { data, status } = await apiFetch<DeepThread>(`/deep_questions?axis=${selectedAxis}`);
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
  }, [router, selectedAxis]);

  const handleSend = async () => {
    if (!input.trim() || !selectedAxis) return;
    setSending(true);
    const { data, status } = await apiFetch<DeepThread>("/deep_questions/messages", {
      method: "POST",
      body: { axis_code: selectedAxis, question: input },
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
    <main id="deep-questions-root" className="bg-slate-50 text-slate-900">
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
                  onChange={(e) => setSelectedAxis(e.target.value)}
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
            </Card>

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
          </div>
        )}
      </Container>
    </main>
  );
}
