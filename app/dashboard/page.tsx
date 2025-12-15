"use client";

import { Suspense, useEffect, useMemo, useState, type ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChartBar, Home, MapPin, Megaphone, Sparkles, Timer, Utensils, Wallet } from "lucide-react";
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
import { getBrowserStorage } from "@/lib/storage";　// からちゃん追加部分 マイページ作成部分に対応

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
  revenue_forecast: "収支予測",
  funds: "資金計画",
  location: "立地",
  interior_exterior: "内装外装",
  menu: "メニュー",
  operation: "オペレーション",
  marketing: "販促",
};

const AXIS_ORDER = ["concept", "revenue_forecast", "funds", "location", "interior_exterior", "menu", "operation", "marketing"];

const AXIS_ICONS: Record<string, any> = {
  concept: Sparkles,
  revenue_forecast: ChartBar,
  funds: Wallet,
  location: MapPin,
  interior_exterior: Home,
  menu: Utensils,
  operation: Timer,
  marketing: Megaphone,
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

  // バックエンドのcodeをフロントエンドのroute codeにマッピング
  const BACKEND_TO_FRONTEND_CODE_MAP: Record<string, string> = {
    concept: "concept",
    revenue_forecast: "revenue_forecast",
    funds: "funding_plan",
    location: "location",
    interior_exterior: "interior_exterior",
    menu: "menu",
    operation: "operation",
    marketing: "marketing",
    // 旧コード名との互換性
    compliance: "funding_plan", // 旧complianceはfunding_planにマッピング
    equipment: "interior_exterior", // 旧equipmentはinterior_exteriorにマッピング
  };

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

  // からちゃん追加部分 マイページ作成部分に対応
  useEffect(() => {
    const storage = getBrowserStorage();
    if (!storage) return;

    const raw = storage.getItem("pending_simple_simulation");
    if (!raw) return;

    // 一度だけ処理するため先に削除
    storage.removeItem("pending_simple_simulation");

    const payload = JSON.parse(raw) as {
      answers: { question_code: string; values: string[] }[];
      guest_session_token?: string | null;
    };

    const submit = async () => {
      try {
        await apiFetch("/simulations/simple/result", {
          method: "POST",
          body: payload,
        });
        // 必要ならここで Dashboard を再取得したい場合は router.refresh() などを検討
      } catch (e) {
        console.error("Failed to persist simple simulation", e);
      }
    };

    submit();
  }, []);

  useEffect(() => {
    if (!data) return;
    if (data.detail_progress.total > 0 && data.detail_progress.answered < data.detail_progress.total) {
      router.replace("/detail_questions");
    }
  }, [data, router]);

  // フロントエンドのcodeからバックエンドのcodeへの逆マッピング
  const FRONTEND_TO_BACKEND_CODE_MAP: Record<string, string> = useMemo(() => {
    const reverseMap: Record<string, string> = {};
    // BACKEND_TO_FRONTEND_CODE_MAPの逆マッピングを作成
    // 注意: 複数のバックエンドコードが同じフロントエンドコードにマッピングされる場合、
    // より具体的なマッピング（interior_exterior）を優先する
    Object.entries(BACKEND_TO_FRONTEND_CODE_MAP).forEach(([backendCode, frontendCode]) => {
      // 既にマッピングがある場合、より具体的なコード（equipmentよりinterior_exteriorを優先）を優先
      if (!reverseMap[frontendCode] || backendCode === frontendCode) {
        reverseMap[frontendCode] = backendCode;
      }
    });
    // マッピングがない場合は、フロントエンドのcode = バックエンドのcodeと仮定
    AXIS_ORDER.forEach((code) => {
      if (!reverseMap[code]) {
        reverseMap[code] = code;
      }
    });
    
    // デバッグログ
    console.log("[DEBUG] FRONTEND_TO_BACKEND_CODE_MAP:", reverseMap);
    console.log("[DEBUG] interior_exterior ->", reverseMap["interior_exterior"]);
    
    return reverseMap;
  }, []);

  const radarData: RadarPoint[] = useMemo(() => {
    if (!data) return [];
    // 既に使用された軸を追跡（同じ軸が複数回マッピングされないように）
    const usedAxisIndices = new Set<number>();
    
    // デバッグログ: バックエンドから受け取ったaxesのcode一覧
    console.log("[DEBUG] data.axes codes:", data.axes.map(a => a.code));
    console.log("[DEBUG] data.axes with scores:", data.axes.map(a => ({ code: a.code, score: a.score })));
    
    // AXIS_ORDERをループの主体として、フロントエンドの定義を「正」とする
    return AXIS_ORDER.map((frontendCode) => {
      // 1. フロントエンドのcodeを、バックエンドが期待するcodeに変換
      const backendCodeCandidate = FRONTEND_TO_BACKEND_CODE_MAP[frontendCode] || frontendCode;
      
      // デバッグログ（内装外装の場合のみ）
      if (frontendCode === "interior_exterior") {
        console.log("[DEBUG INTERIOR_EXTERIOR] frontendCode:", frontendCode);
        console.log("[DEBUG INTERIOR_EXTERIOR] backendCodeCandidate:", backendCodeCandidate);
        console.log("[DEBUG INTERIOR_EXTERIOR] data.axes:", data.axes);
      }
      
      // 2. data.axesの中から、codeが一致するものを探す（まだ使用されていないもの）
      // 注意: バックエンドが"interior_exterior"を返す場合と"equipment"を返す場合の両方に対応
      const targetAxis = data.axes.find(
        (a, idx) => {
          const matches = (a.code === backendCodeCandidate || 
                          (frontendCode === "interior_exterior" && (a.code === "interior_exterior" || a.code === "equipment"))) &&
                        !usedAxisIndices.has(idx);
          if (frontendCode === "interior_exterior" && matches) {
            console.log("[DEBUG INTERIOR_EXTERIOR] ✅ マッチしたaxis:", { code: a.code, score: a.score });
          }
          return matches;
        }
      );
      
      // 3. データがあれば値をセット、なければ0埋め
      if (!targetAxis) {
        // デバッグログ（内装外装の場合のみ）
        if (frontendCode === "interior_exterior") {
          console.log("[DEBUG INTERIOR_EXTERIOR] ❌ マッチするaxisが見つかりませんでした");
          console.log("[DEBUG INTERIOR_EXTERIOR] backendCodeCandidate:", backendCodeCandidate);
          console.log("[DEBUG INTERIOR_EXTERIOR] available codes:", data.axes.map(a => a.code));
        }
        // バックエンドにデータがない場合、フロントエンドのcodeをそのまま使用
        return {
          code: frontendCode,
          label: AXIS_LABELS[frontendCode] ?? frontendCode,
          value: 0,
          okLine: data.ok_line,
        };
      }
      
      // 使用済みとしてマーク
      const axisIndex = data.axes.indexOf(targetAxis);
      if (axisIndex !== -1) {
        usedAxisIndices.add(axisIndex);
      }
      
      // バックエンドのcodeをフロントエンドのcodeに変換（マッピングがあれば）
      const mappedFrontendCode = BACKEND_TO_FRONTEND_CODE_MAP[targetAxis.code] || frontendCode;
      
      // デバッグログ（内装外装の場合のみ）
      if (frontendCode === "interior_exterior") {
        console.log("[DEBUG INTERIOR_EXTERIOR] ✅ 最終的なRadarPoint:", {
          code: mappedFrontendCode,
          label: AXIS_LABELS[frontendCode],
          value: Number(targetAxis.score.toFixed(1)),
        });
      }
      
      return {
        code: mappedFrontendCode,
        label: AXIS_LABELS[frontendCode] ?? frontendCode,
        value: Number(targetAxis.score.toFixed(1)),
        okLine: data.ok_line,
      };
    });
  }, [data, FRONTEND_TO_BACKEND_CODE_MAP]);

  const handleAxisClick = (axisCode: string) => {
    // axisCodeは既にフロントエンドのcode（radarDataで変換済み）なので、そのまま使用
    router.push(`/deep_questions?axis=${axisCode}`);
  };

const renderAngleTick = (props: {
  payload: { value: string; coordinate?: number };
  x: number;
  y: number;
  cx?: number;
  cy?: number;
  midAngle?: number;
  radius?: number;
}): ReactElement<SVGElement> => {
  const { payload, x, y } = props;
  // labelで検索（payload.valueはlabel）
  // AXIS_ORDERの順序で最初に一致するものを使用（重複を防ぐ）
  const point = radarData.find((entry) => entry.label === payload.value);
  if (!point) return <g /> as ReactElement<SVGElement>;
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
    ) as ReactElement<SVGElement>;
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
                    次に強化: {AXIS_LABELS[data.next_focus.axis_code] || data.next_focus.axis_name}（{data.next_focus.reason}）
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
                   AI に自由に質問できます。
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
                  開業プランをグラフィカルに表示するページに遷移します。
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
