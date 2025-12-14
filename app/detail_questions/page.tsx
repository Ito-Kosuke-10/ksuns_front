"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Circle, Loader2, ShieldCheck } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";

type DetailQuestion = {
  code: string;
  axis_code: string;
  axis_label: string;
  text: string;
};

type DetailProgress = {
  answered: number;
  total: number;
};

type DetailQuestionsResponse = {
  questions: DetailQuestion[];
  answers: Record<string, boolean | null>;
  progress: DetailProgress;
};

type SaveResponse = {
  progress: DetailProgress;
};

const AXIS_ORDER = [
  "concept",
  "funds",
  "compliance",
  "operation",
  "location",
  "equipment",
  "marketing",
  "menu",
];

export default function DetailQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<DetailQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [progress, setProgress] = useState<DetailProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, status } = await apiFetch<DetailQuestionsResponse>("/detail_questions");
      if (status === 401) {
        clearAccessToken();
        router.replace("/login");
        return;
      }
      if (data) {
        setQuestions(data.questions);
        setAnswers(data.answers);
        setProgress(data.progress);
      } else {
        setError("詳細質問の取得に失敗しました。時間をおいて再試行してください。");
      }
      setLoading(false);
    };

    load().catch(() => {
      setError("詳細質問の取得に失敗しました。時間をおいて再試行してください。");
      setLoading(false);
    });
  }, [router]);

  const groupedQuestions = useMemo(() => {
    const groups: Record<string, DetailQuestion[]> = {};
    questions.forEach((q) => {
      groups[q.axis_code] = groups[q.axis_code] ? [...groups[q.axis_code], q] : [q];
    });
    return groups;
  }, [questions]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value !== null && value !== undefined).length,
    [answers],
  );

  const totalCount = progress?.total ?? questions.length;
  const completionRatio = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  const allAnswered = totalCount > 0 && answeredCount === totalCount;

  const setAnswer = (questionCode: string, value: boolean) => {
    setAnswers((previous) => {
      const current = previous[questionCode];
      const nextValue = current === value ? null : value;
      return { ...previous, [questionCode]: nextValue };
    });
  };

  const handleSave = async () => {
    const total = totalCount;
    if (total > 0 && answeredCount < total) {
      setError("24問すべてに回答してください。");
      return;
    }
    setSaving(true);
    setError(null);
    const { data, status } = await apiFetch<SaveResponse>("/detail_questions", {
      method: "PUT",
      body: { answers },
    });
    if (status === 401) {
      clearAccessToken();
      router.replace("/login");
      return;
    }
    if (data) {
      setProgress(data.progress);
      router.push("/dashboard");
    } else {
      setError("保存に失敗しました。時間をおいて再試行してください。");
    }
    setSaving(false);
  };

  return (
    <main id="detail-questions-root" className="min-h-screen bg-gradient-to-r from-white to-[#dae4ff] text-slate-900">
      <Container id="detail-questions-container" className="flex flex-col gap-6 py-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detail Questions</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">24問の YES/NO で現状を整理</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4" />
              レーダーに反映
            </span>
          </div>
          <p className="text-sm text-slate-600">
            8カテゴリ×3問を一括で保存します。「保存する」ボタンを押すと、マイページのレーダーチャートが更新されます。
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-sky-700 underline underline-offset-4 hover:text-sky-800"
            >
              ← マイページに戻る
            </Link>
            <span className="text-xs text-slate-500">
              進捗: {answeredCount}/{totalCount} 問回答済み
            </span>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {loading && <Alert>読み込み中...</Alert>}

        {!loading && (
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-slate-800">進捗</p>
                <p className="text-xs text-slate-500">
                  {answeredCount}/{totalCount} 問回答済み
                </p>
              </div>
              <div className="flex-1">
                <div className="h-2 w-full rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-sky-500 transition-[width]"
                    style={{ width: `${completionRatio}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {!loading &&
          AXIS_ORDER.map((axisCode) => {
            const axisQuestions = groupedQuestions[axisCode] ?? [];
            if (axisQuestions.length === 0) return null;
            const answeredForAxis = axisQuestions.filter(
              (q) => answers[q.code] !== null && answers[q.code] !== undefined,
            ).length;

            return (
              <Card id={`detail-questions-axis-${axisCode}`} key={axisCode} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {axisQuestions[0]?.axis_code}
                    </p>
                    <h2 className="text-lg font-semibold text-slate-900">{axisQuestions[0]?.axis_label}</h2>
                    <p className="text-xs text-slate-500">
                      {answeredForAxis}/{axisQuestions.length} 問回答済み
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    YES / NO を選択
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {axisQuestions.map((question) => {
                    const value = answers[question.code];
                    return (
                      <div
                        key={question.code}
                        className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <Circle className="mt-0.5 h-4 w-4 text-sky-500" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{question.text}</p>
                            <p className="text-xs text-slate-500">
                              {value === null || value === undefined
                                ? "未回答"
                                : value
                                  ? "YES を選択中"
                                  : "NO を選択中"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAnswer(question.code, true)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                              value === true
                                ? "border border-sky-300 bg-sky-100 text-sky-700 shadow-sm"
                                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setAnswer(question.code, false)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                              value === false
                                ? "border border-rose-300 bg-rose-100 text-rose-700 shadow-sm"
                                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}

        {!loading && (
          <div id="detail-questions-footer" className="mt-4 flex justify-end">
            <Button
              id="detail-questions-save-button"
              onClick={handleSave}
              disabled={saving || !allAnswered}
              className="px-6 py-3"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中...
                </span>
              ) : (
                "保存する"
              )}
            </Button>
          </div>
        )}
      </Container>
    </main>
  );
}
