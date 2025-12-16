"use client";

import { Suspense, useEffect, useMemo, useState, useRef, type ReactElement, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChartBar, Home, MapPin, Megaphone, Sparkles, Timer, Utensils, Wallet, LayoutGrid, Target } from "lucide-react";
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
import { getBrowserStorage } from "@/lib/storage";
import { MindmapSVG } from "@/app/components/mindmap";

// 表示モード（レーダー/マインドマップ）
type ViewMode = "radar" | "mindmap";

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

  // ▼追加：表示モード切替（レーダー/マインドマップ）
  const [activeView, setActiveView] = useState<ViewMode>("radar");
  const carouselRef = useRef<HTMLDivElement>(null);

  // タブ切替時にカルーセルをスクロール
  const handleViewChange = useCallback((view: ViewMode) => {
    setActiveView(view);
    if (carouselRef.current) {
      const scrollLeft = view === "radar" ? 0 : carouselRef.current.scrollWidth / 2;
      carouselRef.current.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, []);

  // カルーセルスクロール時にタブを同期
  const handleCarouselScroll = useCallback(() => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const halfWidth = carouselRef.current.scrollWidth / 2;
      const newView = scrollLeft < halfWidth / 2 ? "radar" : "mindmap";
      if (newView !== activeView) {
        setActiveView(newView);
      }
    }
  }, [activeView]);

  // マインドマップ操作中はカルーセルのスナップを無効化
  const [isMindmapInteracting, setIsMindmapInteracting] = useState(false);
  const handleMindmapInteractionStart = useCallback(() => {
    setIsMindmapInteracting(true);
  }, []);
  const handleMindmapInteractionEnd = useCallback(() => {
    setIsMindmapInteracting(false);
  }, []);
  // ▲追加ここまで
  // ▼追加：プランUI用のlocalStorage管理
  type LocalPlan = { id: string; label: string; created_at: string };

  const PLANS_KEY = "ksuns_plans";
  const SELECTED_PLAN_KEY = "ksuns_selected_plan_id";
  const SIMPLE_FLOW_KEY = "ksuns_simple_flow";

  const storage = useMemo(() => getBrowserStorage(), []);

  const [plans, setPlans] = useState<LocalPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const loadPlans = useCallback(() => {
    if (!storage) return;
    const rawPlans = storage.getItem(PLANS_KEY);
    const parsed: LocalPlan[] = rawPlans ? JSON.parse(rawPlans) : [];
    setPlans(parsed);

    const selected = storage.getItem(SELECTED_PLAN_KEY) || "";
    setSelectedPlanId(selected);
  }, [storage]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const persistPlans = (next: LocalPlan[], nextSelectedId?: string) => {
    if (!storage) return;
    storage.setItem(PLANS_KEY, JSON.stringify(next));
    if (nextSelectedId) storage.setItem(SELECTED_PLAN_KEY, nextSelectedId);
  };

  const startNewPlanFlow = () => {
    if (!storage) return;

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const now = new Date();
    const label = `プラン ${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(
      now.getDate()
    ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const nextPlan: LocalPlan = { id, label, created_at: now.toISOString() };
    const nextPlans = [nextPlan, ...plans];

    persistPlans(nextPlans, id);
    setPlans(nextPlans);
    setSelectedPlanId(id);

    // 「ダッシュボードから新規プラン」フローの印
    storage.setItem(SIMPLE_FLOW_KEY, "new_plan");

    // 簡易シミュへ
    router.push("/simple_simulation/questions/1");
  };

  const handlePlanSelectChange = (value: string) => {
    if (!storage) return;

    if (value === "__new__") {
      startNewPlanFlow();
      return;
    }

    // 既存プランを選んだ時（今回は“選択状態の保存だけ”）
    storage.setItem(SELECTED_PLAN_KEY, value);
    setSelectedPlanId(value);
  };
  // ▲追加ここまで

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
          // 開発用: 認証エラー時はモックデータを使用
          const mockData: DashboardData = {
            concept: { title: "駅近サラリーマン向け居酒屋", description: "仕事帰りにふらっと立ち寄れる大衆居酒屋" },
            axes: AXIS_ORDER.map((code) => ({
              code,
              name: AXIS_LABELS[code] ?? code,
              score: Math.random() * 6 + 2, // 2-8のランダムスコア
              ok_line: 5,
              growth_zone: 6,
              comment: "テストコメント",
              next_step: "次のステップ",
              answered: 3,
              total_questions: 5,
            })),
            detail_progress: { answered: 10, total: 40 },
            next_focus: { axis_code: "concept", axis_name: "コンセプト", reason: "スコアが低い", message: "深掘りしましょう" },
            ok_line: 5,
            growth_zone: 6,
            user_email: "test@example.com (モック)",
          };
          setData(fillAxisSummaries(mockData));
          setLoading(false);
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
    const isHover = point.code === hoverAxis;
    const color = isHover ? HIGHLIGHT_COLOR : "#475569";
    const bgColor = isHover ? "#e0f2fe" : "#f8fafc";
    const borderColor = isHover ? "#38bdf8" : "#e2e8f0";
    // モバイル対応: ラベルサイズを小さく
    const width = 80;
    const height = 26;
    const radiusOffset = 16;
    const textYOffset = 1;
    const fontSize = 10;

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
        <text x={0} y={textYOffset} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={fontSize} fontWeight="500">
          {payload.value}
        </text>
      </g>
    ) as ReactElement<SVGElement>;
  };

  if (loading || !data) {
    return (
      <main id="dashboard-root" className="min-h-screen bg-gradient-to-r from-white to-[#dae4ff] text-slate-900">
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
    <main id="dashboard-root" className="min-h-screen bg-gradient-to-r from-white to-[#dae4ff] text-slate-900">
      <Container id="dashboard-container" className="flex flex-col gap-6 py-10">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard</p>
              <h1 className="text-2xl font-semibold leading-8">開業準備の現在地</h1>
              <p className="text-sm text-slate-600">コンセプトと準備度レーダーの概要を確認できます。</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-sm font-semibold text-slate-700">
              {data.user_email ? (
                <span className="rounded-full bg-slate-100 px-3 py-2">{data.user_email}</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-2">未ログイン</span>
              )}

              {/* ▼追加：プランUI */}
              {plans.length >= 2 ? (
                <select
                  value={selectedPlanId || ""}
                  onChange={(e) => handlePlanSelectChange(e.target.value)}
                  className="h-10 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  {!selectedPlanId ? <option value="">プランを選択</option> : null}

                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}

                  <option value="__new__">＋ 新規プランを検討する</option>
                </select>
              ) : (
                <Button variant="secondary" onClick={startNewPlanFlow} className="px-4 py-2">
                  新規プランを検討する
                </Button>
              )}
              {/* ▲追加：プランUI */}
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

            <Card className="flex flex-col gap-3 p-5 overflow-hidden">
              {/* ▼タブ切替UI */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewChange("radar")}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all
                      ${activeView === "radar"
                        ? "bg-sky-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }
                    `}
                  >
                    <Target className="w-4 h-4" />
                    レーダー
                  </button>
                  <button
                    onClick={() => handleViewChange("mindmap")}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all
                      ${activeView === "mindmap"
                        ? "bg-sky-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }
                    `}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    進捗マップ
                  </button>
                </div>
                {activeView === "radar" && (
                  <div className="hidden items-center gap-2 text-xs text-slate-600 lg:flex">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      現在値
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      OKライン {data.ok_line}
                    </span>
                  </div>
                )}
              </div>
              {/* ▲タブ切替UI */}

              {/* ▼カルーセル（scroll-snap） */}
              <div
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className={`flex overflow-x-auto scrollbar-hide ${
                  isMindmapInteracting ? "snap-none" : "snap-x snap-mandatory"
                }`}
                style={{ scrollBehavior: isMindmapInteracting ? "auto" : "smooth" }}
              >
                {/* Slide 1: レーダーチャート */}
                <div className="flex-shrink-0 w-full snap-center">
                  <div className="h-[320px] sm:h-[380px] md:h-[430px] w-full min-h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
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
                </div>

                {/* Slide 2: マインドマップ */}
                <div
                  className="flex-shrink-0 w-full snap-center"
                  onPointerDownCapture={(e) => {
                    // マインドマップ内でのジェスチャはカルーセルに伝播させない
                    if (activeView === "mindmap") {
                      e.stopPropagation();
                    }
                  }}
                >
                  <div className="h-[320px] sm:h-[380px] md:h-[430px] w-full">
                    <MindmapSVG
                      selectedAxis={hoverAxis}
                      onInteractionStart={handleMindmapInteractionStart}
                      onInteractionEnd={handleMindmapInteractionEnd}
                    />
                  </div>
                </div>
              </div>
              {/* ▲カルーセル */}

              {/* スワイプインジケーター */}
              <div className="flex justify-center gap-2 mt-2">
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeView === "radar" ? "bg-sky-600 w-4" : "bg-slate-300"
                  }`}
                />
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeView === "mindmap" ? "bg-sky-600 w-4" : "bg-slate-300"
                  }`}
                />
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
