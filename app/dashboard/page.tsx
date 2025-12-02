"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  MailQuestion,
  Megaphone,
  ShieldCheck,
  Sofa,
  Sparkles,
  Store,
  Target,
  Timer,
  Utensils,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api-client";
import { clearAccessToken, setAccessToken } from "@/lib/auth-token";

type AxisSummary = {
  code: string;
  name: string;
  score: number;
  ok_line: number;
  growth_zone: number;
  comment: string;
  next_step: string;
  answered: number;
  total_questions: number;
  missing?: number;
};

type DetailProgress = {
  answered: number;
  total: number;
};

type NextFocus = {
  axis_code: string;
  axis_name: string;
  reason: string;
  message: string;
};

type DashboardData = {
  concept: { title: string; description: string };
  axes: AxisSummary[];
  detail_progress: DetailProgress;
  next_focus?: NextFocus | null;
  ok_line: number;
  growth_zone: number;
  owner_note?: string;
  latest_store_story?: string;
  user_email: string;
};

type QAResponse = {
  reply: string;
};

type QAHistoryItem = {
  question: string;
  answer: string;
  axis_code?: string | null;
  created_at: string;
};

type QAListResponse = {
  items: QAHistoryItem[];
};

type RadarPoint = {
  code: string;
  label: string;
  value: number;
  okLine: number;
  isHighlight: boolean;
};

const AXIS_LABELS: Record<string, string> = {
  concept: "コンセプト",
  funds: "収支予測",
  compliance: "資金計画",
  operation: "オペレーション",
  location: "立地",
  equipment: "内装外装",
  marketing: "販促",
  menu: "メニュー",
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

const AXIS_ICONS: Record<string, LucideIcon> = {
  concept: Sparkles,
  funds: Wallet,
  compliance: ShieldCheck,
  operation: Timer,
  location: Store,
  equipment: Sofa,
  marketing: Megaphone,
  menu: Utensils,
};

const PRIMARY_COLOR = "#0ea5e9";
const OK_LINE_COLOR = "#16a34a";
const HIGHLIGHT_COLOR = "#0284c7";

export default function DashboardPage() {
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
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qaInput, setQaInput] = useState("");
  const [qaReply, setQaReply] = useState<string | null>(null);
  const [qaSending, setQaSending] = useState(false);
  const [hoverAxis, setHoverAxis] = useState<string | null>(null);
  const [qaHistory, setQaHistory] = useState<QAHistoryItem[]>([]);

  const loadQaHistory = useCallback(async () => {
    const { data, status } = await apiFetch<QAListResponse>("/qa/messages?limit=4");
    if (status === 401) {
      clearAccessToken();
      router.replace("/login");
      return;
    }
    if (data?.items) {
      setQaHistory(data.items);
    }
  }, [router]);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("access_token");
    if (tokenFromUrl) {
      setAccessToken(tokenFromUrl);
      router.replace("/dashboard");
      return;
    }

    const load = async () => {
      const { data, status } = await apiFetch<DashboardData>("/dashboard");
      if (status === 401) {
        clearAccessToken();
        router.replace("/");
        return;
      }
      if (data) {
        setData(fillAxisSummaries(data));
        loadQaHistory();
      } else {
        setError("ダッシュボードの取得に失敗しました。時間をおいて再試行してください。");
      }
      setLoading(false);
    };
    load().catch(() => {
      setError("ダッシュボードの取得に失敗しました。時間をおいて再試行してください。");
      setLoading(false);
    });
  }, [router, searchParams, loadQaHistory]);

  const radarData: RadarPoint[] = useMemo(() => {
    if (!data) return [];
    return data.axes.map((axis) => ({
      code: axis.code,
      label: AXIS_LABELS[axis.code] ?? axis.name ?? axis.code,
      value: Number(axis.score.toFixed(1)),
      okLine: data.ok_line,
      isHighlight: data.next_focus?.axis_code === axis.code,
    }));
  }, [data]);

  const handleAxisClick = (axisCode: string) => {
    router.push(`/axes/${axisCode}`);
  };

  const handleQaSend = async () => {
    if (!qaInput.trim()) return;
    setQaSending(true);
    const { data, status } = await apiFetch<QAResponse>("/qa/messages", {
      method: "POST",
      body: { question: qaInput, context_type: "global" },
    });
    if (status === 401) {
      clearAccessToken();
      router.replace("/login");
      return;
    }
    if (data?.reply) {
      setQaReply(data.reply);
      setQaInput("");
      await loadQaHistory();
    } else {
      setError("回答の取得に失敗しました。時間をおいて再試行してください。");
    }
    setQaSending(false);
  };

  const renderAngleTick = ({ payload, x, y }: { payload: { value: string }; x: number; y: number }) => {
    const point = radarData.find((entry) => entry.label === payload.value);
    const Icon = point ? AXIS_ICONS[point.code] : null;
    const isHighlight = point?.isHighlight ?? false;
    const isHover = point?.code === hoverAxis;
    const color = isHover || isHighlight ? HIGHLIGHT_COLOR : "#475569";
    const code = point?.code;

    return (
      <g
        transform={`translate(${x},${y})`}
        style={{ cursor: "pointer" }}
        onClick={() => code && handleAxisClick(code)}
        onMouseEnter={() => code && setHoverAxis(code)}
        onMouseLeave={() => setHoverAxis(null)}
      >
        <rect x={-50} y={-14} width={100} height={28} fill="transparent" />
        {Icon ? (
          <Icon className="h-4 w-4" style={{ color }} aria-hidden="true" transform="translate(-18, 0)" />
        ) : (
          <g />
        )}
        <text x={2} y={4} textAnchor="start" fill={color} fontSize={12}>
          {payload.value}
        </text>
      </g>
    );
  };

  const detailProgressRatio =
    data && data.detail_progress.total > 0
      ? Math.round((data.detail_progress.answered / data.detail_progress.total) * 100)
      : 0;

  const deepQuestionAxis = data?.next_focus?.axis_code;

  return (
    <main id="dashboard-root" className="bg-slate-50 text-slate-900">
      <Container id="dashboard-container" className="flex flex-col gap-6 py-10">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard</p>
              <h1 className="text-2xl font-semibold text-slate-900">現在地と次の一歩</h1>
              <p className="text-sm text-slate-600">
                コンセプトとレーダーチャートで開業準備の全体像を確認し、次に強化するポイントを1つに絞って進めましょう。
              </p>
            </div>
            {data?.user_email && (
              <div className="mt-2 text-right text-xs text-slate-600 sm:mt-0">
                <p className="font-semibold text-slate-700">ログイン中</p>
                <p className="truncate">{data.user_email}</p>
              </div>
            )}
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {loading && <Alert>読み込み中...</Alert>}

        {!loading && data && (
          <div className="flex flex-col gap-6">
            <section className="grid gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-2 flex h-full flex-col justify-between bg-linear-to-br from-white to-slate-100">
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Concept</p>
                  <h2 className="text-xl font-semibold text-slate-900">{data.concept.title}</h2>
                  <p className="text-sm leading-6 text-slate-700">{data.concept.description}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href="/simple_simulation/questions/1"
                    className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    もう一度診断する
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <span className="text-xs text-slate-500">
                    直近の回答をベースにもう一度シミュレーションを回せます。
                  </span>
                </div>
              </Card>

              <Card className="lg:col-span-3 flex h-full flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Radar</p>
                    <h2 className="text-lg font-semibold text-slate-900">開業準備レーダー</h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                      <span className="h-3 w-3 rounded-full border border-slate-300" />
                      現在値
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                      <span className="h-3 w-3 rounded-full border border-dashed border-green-500" />
                      OKライン {data.ok_line}
                    </span>
                  </div>
                </div>
                <div className="mt-4 h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="label" tick={renderAngleTick} />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 10]}
                        tick={({ payload, x, y }) => (
                          <text x={x} y={y} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                            {payload.value}
                          </text>
                        )}
                        strokeOpacity={0}
                      />
                      <Radar
                        name="ok"
                        dataKey="okLine"
                        stroke={OK_LINE_COLOR}
                        fill="transparent"
                        isAnimationActive={false}
                        strokeDasharray="4 4"
                      />
                      <Radar
                        name="score"
                        dataKey="value"
                        stroke={PRIMARY_COLOR}
                        fill={PRIMARY_COLOR}
                        fillOpacity={0.25}
                      />
                      <Radar
                        name="focus"
                        dataKey={(entry: RadarPoint) => (entry.isHighlight ? entry.value : 0)}
                        stroke={HIGHLIGHT_COLOR}
                        fill={HIGHLIGHT_COLOR}
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    詳細質問 {data.detail_progress.answered}/{data.detail_progress.total} 回答済み
                  </span>
                  {data.next_focus && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-700">
                      次に強化: {data.next_focus.axis_name}
                    </span>
                  )}
                </div>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detail</p>
                    <h3 className="text-lg font-semibold text-slate-900">詳細質問</h3>
                    <p className="text-xs text-slate-600">
                      24問のYES/NOでレーダーを更新します。未回答を埋めましょう。
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    {detailProgressRatio}% 完了
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-sky-500 transition-[width]"
                    style={{ width: `${detailProgressRatio}%` }}
                  />
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/detail_questions"
                    className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    回答を開く
                  </Link>
                </div>
              </Card>

              <Card className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deep Dive</p>
                    <h3 className="text-lg font-semibold text-slate-900">深掘り質問</h3>
                    <p className="text-xs text-slate-600">
                      AI に相談しながら不足している軸を深掘りできます。
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => router.push(deepQuestionAxis ? `/deep_questions?axis=${deepQuestionAxis}` : "/deep_questions")}
                    className="px-4 py-2"
                  >
                    深掘りをはじめる
                  </Button>
                </div>
              </Card>

            <Card className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2">
                <MailQuestion className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chat</p>
                  <h3 className="text-lg font-semibold text-slate-900">なんでも質問ボックス</h3>
                </div>
              </div>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                rows={3}
                value={qaInput}
                onChange={(event) => setQaInput(event.target.value)}
                placeholder="気になることを自由に入力してください"
              />
              <div className="flex justify-end">
                <Button onClick={handleQaSend} disabled={qaSending} className="px-4 py-2">
                  送信
                </Button>
              </div>
              {qaReply && (
                <div className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-800">{qaReply}</div>
              )}
              {qaHistory.length > 0 && (
                <div className="mt-2 space-y-2">
                  {qaHistory.map((item, idx) => (
                    <div key={`${item.created_at}-${idx}`} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500">
                        Q: {item.axis_code ? `[${item.axis_code}] ` : ""}{item.question}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-800">A: {item.answer}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

            {data.next_focus && (
              <Card className="flex flex-col gap-3 border border-sky-100 bg-sky-50 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-sky-600" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Next Action</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">優先すべき軸は1つだけ</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{data.next_focus.axis_name}</h3>
                <p className="text-sm text-slate-700">{data.next_focus.reason}</p>
                <p className="text-sm font-semibold text-slate-900">{data.next_focus.message}</p>
              </Card>
            )}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.axes.map((axis) => {
                const Icon = AXIS_ICONS[axis.code];
                return (
                  <Card
                    key={axis.code}
                    className="flex cursor-pointer flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                    onClick={() => handleAxisClick(axis.code)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                          {Icon ? <Icon className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                        </span>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">{axis.code}</p>
                          <h4 className="text-sm font-semibold text-slate-900">{AXIS_LABELS[axis.code] ?? axis.name}</h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Score</p>
                        <p className="text-xl font-semibold text-slate-900">{axis.score.toFixed(1)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700">{axis.comment}</p>
                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">次の一歩</p>
                      <p>{axis.next_step}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>
                        回答状況: {axis.answered}/{axis.total_questions}
                      </span>
                      <span>・ OKライン {axis.ok_line}</span>
                    </div>
                  </Card>
                );
              })}
            </section>
          </div>
        )}
      </Container>
    </main>
  );
}

function fillAxisSummaries(data: DashboardData): DashboardData {
  const map = new Map<string, AxisSummary>();
  data.axes.forEach((axis) => map.set(axis.code, axis));
  const filledAxes = AXIS_ORDER.map((code) => {
    const axis = map.get(code);
    if (axis) return axis;
    return {
      code,
      name: AXIS_LABELS[code] ?? code,
      score: 0,
      ok_line: data.ok_line ?? 5,
      growth_zone: data.growth_zone ?? 6,
      comment: "No score yet. Answer the detail questions to calculate.",
      next_step: "Open the detail questions for this axis to generate a score.",
      answered: 0,
      total_questions: 3,
      missing: 3,
    };
  });
  return { ...data, axes: filledAxes };
}
