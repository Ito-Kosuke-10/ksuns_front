"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Megaphone, ShieldCheck, Sparkles, Timer, Wallet } from "lucide-react";
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

type RadarPoint = {
  code: string;
  label: string;
  value: number;
  okLine: number;
};

const AXIS_LABELS: Record<string, string> = {
  concept: "コンセプト",
  funds: "資金計画",
  compliance: "コンプライアンス",
  operation: "オペレーション",
  location: "立地",
  equipment: "設備",
  marketing: "集客",
  menu: "メニュー",
};

const AXIS_ORDER = ["concept", "funds", "compliance", "operation", "location", "equipment", "marketing", "menu"];

const AXIS_ICONS: Record<string, any> = {
  concept: Sparkles,
  funds: Wallet,
  compliance: ShieldCheck,
  operation: Timer,
  location: Megaphone,
  equipment: ShieldCheck,
  marketing: Megaphone,
  menu: Wallet,
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
  const [hoverAxis, setHoverAxis] = useState<string | null>(null);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("access_token");
    if (tokenFromUrl) {
      setAccessToken(tokenFromUrl);
      router.replace("/dashboard");
      return;
    }

    const load = async () => {
      try {
        const { data, status } = await apiFetch<DashboardData>("/dashboard");
        if (status === 401) {
          clearAccessToken();
          router.replace("/");
          return;
        }
        if (data) {
          setData(fillAxisSummaries(data));
        } else {
          setError("ダッシュボードの取得に失敗しました。時間をおいて再試行してください。");
        }
      } catch {
        setError("ダッシュボードの取得に失敗しました。時間をおいて再試行してください。");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router, searchParams]);

  useEffect(() => {
    if (!data) return;
    if (data.detail_progress.total > 0 && data.detail_progress.answered < data.detail_progress.total) {
      router.replace("/detail_questions");
    }
  }, [data, router]);

  const radarData: RadarPoint[] = useMemo(() => {
    if (!data) return [];
    return data.axes.map((axis) => ({
      code: axis.code,
      label: AXIS_LABELS[axis.code] ?? axis.name ?? axis.code,
      value: Number(axis.score.toFixed(1)),
      okLine: data.ok_line,
    }));
  }, [data]);

  const handleAxisClick = (axisCode: string) => {
    router.push(`/axes/${axisCode}`);
  };

const renderAngleTick = (props: {
  payload: { value: string; coordinate?: number };
  x: number;
  y: number;
  cx?: number;
  cy?: number;
  midAngle?: number;
  radius?: number;
}): JSX.Element => {
  const { payload, x, y } = props;
  const point = radarData.find((entry) => entry.label === payload.value);
  if (!point) return <g />;
    const Icon = AXIS_ICONS[point.code];
    const isHover = point.code === hoverAxis;
    const color = isHover ? HIGHLIGHT_COLOR : "#475569";
    const bgColor = isHover ? "#e0f2fe" : "#f8fafc";
    const borderColor = isHover ? "#38bdf8" : "#e2e8f0";
    const width = 124;
    const height = 34;
    const radiusOffset = 24;
    const iconYOffset = -11;
    const textYOffset = 4;

    const cxVal = Number.isFinite(props.cx) ? (props.cx as number) : 0;
    const cyVal = Number.isFinite(props.cy) ? (props.cy as number) : 0;
    const angleDeg = Number.isFinite((props.payload as any).coordinate)
      ? ((props.payload as any).coordinate as number)
      : Number.isFinite(props.midAngle)
        ? (props.midAngle as number)
        : 0;
    const baseRadius = Number.isFinite(props.radius)
      ? (props.radius as number)
      : Math.hypot((x ?? 0) - cxVal, (y ?? 0) - cyVal);
    const r = baseRadius + radiusOffset;
    const rad = (-angleDeg * Math.PI) / 180;
    const tx = cxVal + r * Math.cos(rad);
    const ty = cyVal + r * Math.sin(rad);

    const fx = Number.isFinite(tx) ? tx : x ?? 0;
    const fy = Number.isFinite(ty) ? ty : y ?? 0;

    return (
      <g
        transform={`translate(${fx},${fy})`}
        style={{ cursor: "pointer" }}
        onClick={() => handleAxisClick(point.code)}
        onMouseEnter={() => setHoverAxis(point.code)}
        onMouseLeave={() => setHoverAxis(null)}
      >
        <rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          rx={height / 2}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={1}
        />
        {Icon ? (
          <Icon
            className="h-4 w-4"
            style={{ color }}
            aria-hidden="true"
            transform={`translate(${-width / 2}, ${iconYOffset})`}
          />
        ) : null}
        <text x={Icon ? -width / 2 + 30 : -width / 2 + 10} y={textYOffset} textAnchor="start" fill={color} fontSize={12}>
          {payload.value}
        </text>
      </g>
    );
  };

  if (loading || !data) {
    return (
      <main id="dashboard-root" className="bg-slate-50 text-slate-900">
        <Container id="dashboard-container" className="flex flex-col gap-6 py-10">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard</p>
                <h1 className="text-2xl font-semibold leading-8">開業準備の現在地</h1>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="rounded-full bg-slate-100 px-3 py-2">
                  {error ? "取得エラー" : "読み込み中..."}
                </span>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
              <Card className="h-40 animate-pulse bg-slate-100" />
              <Card className="h-40 animate-pulse bg-slate-100" />
            </div>
          </div>
          {error ? <Alert variant="error">{error}</Alert> : <Alert>読み込み中...</Alert>}
        </Container>
      </main>
    );
  }

  const deepQuestionAxis = data.next_focus?.axis_code;

  return (
    <main id="dashboard-root" className="bg-slate-50 text-slate-900">
      <Container id="dashboard-container" className="flex flex-col gap-6 py-10">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard</p>
              <h1 className="text-2xl font-semibold leading-8">開業準備の現在地</h1>
              <p className="text-sm text-slate-600">コンセプトと準備度レーダーの概要を確認できます。</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              {data.user_email ? (
                <span className="rounded-full bg-slate-100 px-3 py-2">{data.user_email}</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-2">未ログイン</span>
              )}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
            <Card className="flex flex-col gap-3 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Concept</p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {data.concept.title || "コンセプト未設定"}
                </h3>
                <p className="text-sm text-slate-700">
                  {data.concept.description || "結果を保存してコンセプトを確認してください。"}
                </p>
              </div>
            </Card>

            <Card className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Radar</p>
                  <h3 className="text-lg font-semibold text-slate-900">準備度レーダー</h3>
                </div>
                <div className="hidden items-center gap-2 text-xs text-slate-600 lg:flex">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    現在値
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    OKライン {data.ok_line}
                  </span>
                </div>
              </div>
              <div className="mt-2 h-[430px] w-full">
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
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deep Dive</p>
                <h3 className="text-lg font-semibold text-slate-900">深掘り質問</h3>
                <p className="text-xs text-slate-600">
                  AI に相談しながら考えを深めたいときに使えるチャット形式の質問です。
                </p>
                {data.next_focus && (
                  <p className="mt-1 text-xs text-slate-700">
                    次に強化: {data.next_focus.axis_name}（{data.next_focus.reason}）
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  router.push(deepQuestionAxis ? `/deep_questions?axis=${deepQuestionAxis}` : "/deep_questions")
                }
                className="px-4 py-2"
              >
                深掘りを始める
              </Button>
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chat</p>
                <h3 className="text-lg font-semibold text-slate-900">なんでも質問</h3>
                <p className="text-xs text-slate-600">
                  別ページで AI に自由に質問できます（現在はハリボテ画面）。
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => router.push("/chat")} className="px-4 py-2">
                Chat ページへ
              </Button>
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Report</p>
                <h3 className="text-lg font-semibold text-slate-900">開業プラン出力</h3>
                <p className="text-xs text-slate-600">
                  開業プランをグラフィカルに表示するページに遷移します（現在はハリボテ画面）。
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => router.push("/report")} className="px-4 py-2">
                Report ページへ
              </Button>
            </div>
          </Card>
        </section>

        <section className="mt-auto flex flex-wrap gap-3 pt-4" />
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
