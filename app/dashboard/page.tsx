"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Layers,
  FileText,
  Home,
  MailQuestion,
  Megaphone,
  ShieldCheck,
  Sofa,
  Sparkles,
  Store,
  Timer,
  Users,
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

type DashboardData = {
  axis_scores: Record<string, number>;
  ok_line: number;
  latest_store_story: string;
  owner_note: string;
  recommended_axes: string[];
};

type QAResponse = {
  reply: string;
};

type RadarPoint = {
  code: string;
  label: string;
  score: number;
  value: number;
  gap: number;
  isHighlight: boolean;
  isGrow: boolean;
  okLine: number;
};

const AXIS_LABELS: Record<string, string> = {
  concept: "コンセプト",
  funds: "収支予測",
  compliance: "資金計画",
  operation: "オペレーション",
  location: "立地",
  equipment: "内装・外装",
  marketing: "販促",
  menu: "メニュー",
};

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

const SUMMARY_TYPES = [
  { code: "family", label: "家族向け", icon: Home },
  { code: "staff", label: "従業員向け", icon: Users },
  { code: "bank", label: "銀行向け", icon: FileText },
  { code: "public", label: "公的機関向け", icon: Layers },
];

const BASE_COLOR = "#0ea5e9";
const HIGHLIGHT_COLOR = "#4c8fbd";
const OK_LINE_COLOR = "#16a34a";
const LABEL_COLOR = "#475569";
const ICON_COLOR = "#3b82f6";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qaInput, setQaInput] = useState("");
  const [qaReply, setQaReply] = useState<string | null>(null);
  const [qaSending, setQaSending] = useState(false);
  const [hoverAxis, setHoverAxis] = useState<string | null>(null);

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
        router.replace("/login");
        return;
      }
      if (data) {
        setData(fillMissingAxisScores(data));
        setNote(data.owner_note);
      } else {
        setError("取得に失敗しました。時間をおいて再試行してください。");
      }
      setLoading(false);
    };
    load().catch(() => {
      setError("取得に失敗しました。時間をおいて再試行してください。");
      setLoading(false);
    });
  }, [router, searchParams]);

  const radarData: RadarPoint[] = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.axis_scores);
    const gaps = entries.map(([code, score]) => {
      const numericScore = Number(Number(score).toFixed(1));
      return {
        code,
        label: AXIS_LABELS[code] ?? code,
        score: numericScore,
        value: Math.min(numericScore, 5),
        gap: Math.max(0, 5 - numericScore),
        isHighlight: false,
        isGrow: numericScore > 5,
        okLine: 5,
      };
    });
    const sorted = [...gaps].sort((a, b) => b.gap - a.gap);
    const thirdGap = sorted[2]?.gap ?? sorted[sorted.length - 1]?.gap ?? 0;
    const highlightSet = new Set(sorted.filter((g) => g.gap >= thirdGap).map((g) => g.code));

    return gaps.map((g) => ({
      ...g,
      isHighlight: highlightSet.has(g.code),
    }));
  }, [data]);

  const handleAxisClick = (axisCode: string) => {
    router.push(`/axes/${axisCode}`);
  };

  const handleSaveNote = async () => {
    const { status } = await apiFetch("/dashboard/owner-note", {
      method: "PUT",
      body: { content: note },
    });
    if (status === 200) return;
    if (status === 401) {
      clearAccessToken();
      router.replace("/login");
    } else {
      setError("保存に失敗しました。時間をおいて再試行してください。");
    }
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
    } else {
      setError("回答の取得に失敗しました。時間をおいて再試行してください。");
    }
    setQaSending(false);
  };

  const handleSummaryNavigate = (type: string) => {
    router.push(`/summaries?type=${type}`);
  };

  const renderAngleTick = ({ payload, x, y }: { payload: any; x: number; y: number }) => {
    const point = radarData.find((entry) => entry.label === payload.value);
    const Icon = point ? AXIS_ICONS[point.code] : null;
    const isHighlight = point?.isHighlight ?? false;
    const isHover = point?.code === hoverAxis;
    const iconColor = isHover ? HIGHLIGHT_COLOR : isHighlight ? HIGHLIGHT_COLOR : ICON_COLOR;
    const textColor = isHover ? HIGHLIGHT_COLOR : isHighlight ? HIGHLIGHT_COLOR : LABEL_COLOR;
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
          <Icon className="h-4 w-4" style={{ fill: "none", color: iconColor }} aria-hidden="true" transform="translate(-18, 0)" />
        ) : (
          <g />
        )}
        <text x={2} y={4} textAnchor="start" fill={textColor} fontSize={12}>
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <main className="bg-slate-50 text-slate-900">
      <Container className="flex flex-col gap-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">マイページ</h1>
        {error && <Alert variant="error">{error}</Alert>}
        {loading && <Alert>読み込み中...</Alert>}
        {!loading && data && (
          <div className="flex flex-col gap-6">
            {/* 上段：レーダースコアと店舗イメージ */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="flex h-full min-h-[360px] flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">レーダースコア</h2>
                </div>
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="label" tick={renderAngleTick} />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 5]}
                        tick={({ payload, x, y }) => {
                          const isOkLine = Number(payload.value) === 5;
                          return (
                            <text
                              x={x}
                              y={y}
                              textAnchor="middle"
                              fill={isOkLine ? OK_LINE_COLOR : "#94a3b8"}
                              fontSize={10}
                            >
                              {payload.value}
                            </text>
                          );
                        }}
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
                        stroke={BASE_COLOR}
                        fill={BASE_COLOR}
                        fillOpacity={0.2}
                      />
                      <Radar
                        name="highlight"
                        dataKey={(entry: RadarPoint) => (entry.isHighlight ? entry.value : 0)}
                        stroke={HIGHLIGHT_COLOR}
                        fill={HIGHLIGHT_COLOR}
                        fillOpacity={0.15}
                      />
                      <Radar
                        name="growth"
                        dataKey={(entry: RadarPoint) => (entry.isGrow ? 5 : 0)}
                        stroke={OK_LINE_COLOR}
                        fill={OK_LINE_COLOR}
                        fillOpacity={0.1}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                {data.recommended_axes.length > 0 && (
                  <p className="mt-2 text-sm text-sky-700">
                    今取り組むと良いテーマ: {data.recommended_axes.map((code) => AXIS_LABELS[code] ?? code).join(" / ")}
                  </p>
                )}
              </Card>

              <Card className="flex h-full min-h-[360px] flex-col">
                <h2 className="text-lg font-semibold text-slate-900">店舗イメージ</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {data.latest_store_story || "まだ生成されていません。"}
                </p>
              </Card>
            </div>

            {/* 中段：店長メモ */}
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">店長メモ</h2>
              <textarea
                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="気づきやアイデアをメモしましょう"
              />
              <div className="mt-3 flex justify-end">
                <Button onClick={handleSaveNote}>メモを保存</Button>
              </div>
            </Card>

            {/* 下段：サマリーと質問ボックス（縦並び） */}
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">サマリー</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {SUMMARY_TYPES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSummaryNavigate(item.code)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <MailQuestion className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold text-slate-900">質問ボックス</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                気になることを気軽に相談できます。回答はこのボックス内に表示します。
              </p>
              <textarea
                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                rows={3}
                value={qaInput}
                onChange={(event) => setQaInput(event.target.value)}
                placeholder="質問を入力してください"
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={handleQaSend}
                  disabled={qaSending}
                  className="px-4 py-2"
                >
                  送信
                </Button>
              </div>
              {qaReply && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-800">{qaReply}</div>
              )}
            </Card>
          </div>
        )}
      </Container>
    </main>
  );
}

function fillMissingAxisScores(data: DashboardData): DashboardData {
  const filled: Record<string, number> = {};
  Object.keys(AXIS_LABELS).forEach((code) => {
    filled[code] = data.axis_scores?.[code] ?? 0;
  });
  return { ...data, axis_scores: filled };
}
