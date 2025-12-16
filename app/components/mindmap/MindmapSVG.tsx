"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";
import {
  type MindmapState,
  type NodeStatus,
  AXIS_CONFIG,
} from "./types";

type MindmapSVGProps = {
  selectedAxis?: string | null;
  onNodeClick?: (nodeId: string, axisCode: string) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
};

// ステータスで色を決定
const getStatusColors = (status: NodeStatus) => {
  switch (status) {
    case "completed":
      return { fill: "#22c55e", stroke: "#16a34a", text: "#ffffff" };
    case "in_progress":
      return { fill: "#f59e0b", stroke: "#d97706", text: "#ffffff" };
    default:
      return { fill: "#ffffff", stroke: "#cbd5e1", text: "#334155" };
  }
};

// 各軸のSTEPとその項目を定義（実際のページ構造と一致）
const AXIS_STEPS: Record<string, { steps: { id: string; name: string; items: { id: string; title: string }[] }[] }> = {
  concept: {
    steps: [
      { id: "step1", name: "STEP1", items: [
        { id: "1-1", title: "動機・世界観" },
        { id: "1-2", title: "ターゲット" },
        { id: "1-3", title: "コア価値" },
        { id: "1-4", title: "店舗タイプ" },
      ]},
      { id: "step2", name: "STEP2", items: [
        { id: "2-1", title: "競合分析" },
        { id: "2-2", title: "提供体験" },
        { id: "2-3", title: "店舗の個性" },
        { id: "2-4", title: "顧客との関係性" },
      ]},
      { id: "step3", name: "STEP3", items: [
        { id: "3-1", title: "提供価値の整合性" },
        { id: "3-2", title: "メッセージ" },
        { id: "3-3", title: "未来への展望" },
      ]},
    ],
  },
  revenue_forecast: {
    steps: [
      { id: "step1", name: "STEP1", items: [
        { id: "1", title: "客単価（昼）" },
        { id: "2", title: "客単価（夜）" },
        { id: "3", title: "席数" },
        { id: "4", title: "原価率目標" },
        { id: "5", title: "営業日数" },
      ]},
      { id: "step2", name: "STEP2", items: [
        { id: "6", title: "営業時間（昼）" },
        { id: "7", title: "営業時間（夜）" },
        { id: "8", title: "回転率（昼）" },
        { id: "9", title: "回転率（夜）" },
        { id: "10", title: "オーナー報酬" },
      ]},
      { id: "step3", name: "STEP3", items: [
        { id: "11", title: "人件費" },
        { id: "12", title: "家賃" },
        { id: "13", title: "光熱費" },
        { id: "14", title: "人件費率" },
        { id: "15", title: "販管費率" },
      ]},
    ],
  },
  funding_plan: {
    steps: [
      { id: "step1", name: "STEP1", items: [
        { id: "1", title: "自己資金" },
        { id: "2", title: "内装・設備費" },
        { id: "3", title: "リース活用" },
        { id: "4", title: "敷金・保証金" },
      ]},
      { id: "step2", name: "STEP2", items: [
        { id: "5", title: "販促・広告費" },
        { id: "6", title: "運転資金" },
        { id: "7", title: "運転資金月数" },
        { id: "8", title: "運転資金総額" },
      ]},
      { id: "step3", name: "STEP3", items: [
        { id: "9", title: "初期投資総額" },
        { id: "10", title: "不足資金" },
        { id: "11", title: "借入希望先" },
        { id: "12", title: "資金調達目標" },
      ]},
    ],
  },
  location: {
    steps: [
      { id: "step1", name: "STEP1", items: [
        { id: "1", title: "ターゲットエリア" },
        { id: "2", title: "家賃目安" },
        { id: "3", title: "理想の坪数" },
        { id: "4", title: "ターゲット商圏" },
      ]},
      { id: "step2", name: "STEP2", items: [
        { id: "5", title: "エリア環境" },
        { id: "6", title: "通行量/視認性" },
        { id: "7", title: "アクセス手段" },
        { id: "8", title: "契約条件" },
      ]},
      { id: "step3", name: "STEP3", items: [
        { id: "9", title: "時間帯別需要" },
        { id: "10", title: "競合優位性" },
        { id: "11", title: "契約リスク" },
        { id: "12", title: "最終エリア決定" },
      ]},
    ],
  },
  interior_exterior: {
    steps: [
      { id: "step1", name: "STEP1", items: [
        { id: "1", title: "デザインテーマ" },
        { id: "2", title: "キーカラー" },
        { id: "3", title: "ファサード" },
        { id: "4", title: "ゾーニング" },
      ]},
      { id: "step2", name: "STEP2", items: [
        { id: "5", title: "厨房機器" },
        { id: "6", title: "照明" },
        { id: "7", title: "家具・什器" },
        { id: "8", title: "看板・サイン" },
      ]},
      { id: "step3", name: "STEP3", items: [
        { id: "9", title: "予算配分" },
        { id: "10", title: "施工業者選定" },
        { id: "11", title: "参考イメージ" },
        { id: "12", title: "デザイン要望書" },
      ]},
    ],
  },
  menu: {
    steps: [
      { id: "step1", name: "STEP1", items: [
        { id: "1", title: "看板メニュー" },
        { id: "2", title: "メニュー構成比" },
        { id: "3", title: "品数・カテゴリ" },
        { id: "4", title: "価格帯" },
      ]},
      { id: "step2", name: "STEP2", items: [
        { id: "5", title: "仕入れ・食材" },
        { id: "6", title: "原価率設定" },
        { id: "7", title: "ドリンク戦略" },
        { id: "8", title: "季節性・更新" },
      ]},
      { id: "step3", name: "STEP3", items: [
        { id: "9", title: "調理効率" },
        { id: "10", title: "厨房整合性" },
        { id: "11", title: "メニューブック" },
        { id: "12", title: "AI模擬来店" },
      ]},
    ],
  },
  operation: {
    steps: [
      { id: "step1", name: "STEP1", items: [
        { id: "1", title: "サービススタイル" },
        { id: "2", title: "お客様の流れ" },
        { id: "3", title: "ピーク時対応" },
        { id: "4", title: "決済方法" },
      ]},
      { id: "step2", name: "STEP2", items: [
        { id: "5", title: "調理オペ" },
        { id: "6", title: "人員構成" },
        { id: "7", title: "スタッフ育成" },
        { id: "8", title: "顧客満足度" },
      ]},
      { id: "step3", name: "STEP3", items: [
        { id: "9", title: "トラブル対応" },
        { id: "10", title: "衛生管理" },
        { id: "11", title: "在庫管理" },
        { id: "12", title: "閉店後作業" },
      ]},
    ],
  },
  marketing: {
    steps: [
      { id: "step1", name: "STEP1", items: [
        { id: "1", title: "メディア選定" },
        { id: "2", title: "MEO対策" },
        { id: "3", title: "SNS運用" },
        { id: "4", title: "オープニング" },
      ]},
      { id: "step2", name: "STEP2", items: [
        { id: "5", title: "グルメサイト" },
        { id: "6", title: "リピーター施策" },
        { id: "7", title: "写真・クリエ" },
        { id: "8", title: "アナログ販促" },
      ]},
      { id: "step3", name: "STEP3", items: [
        { id: "9", title: "販促カレンダー" },
        { id: "10", title: "販促予算" },
        { id: "11", title: "発信ルーティン" },
        { id: "12", title: "プレスリリース" },
      ]},
    ],
  },
};

// Pointer情報を保持する型
type PointerInfo = {
  id: number;
  x: number;
  y: number;
};

export function MindmapSVG({ selectedAxis, onNodeClick, onInteractionStart, onInteractionEnd }: MindmapSVGProps) {
  const router = useRouter();
  const [mindmapState, setMindmapState] = useState<MindmapState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [expandedAxes, setExpandedAxes] = useState<Set<string>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // ズーム・パン状態
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [initialFitDone, setInitialFitDone] = useState(false);

  // ポインター管理
  const pointersRef = useRef<Map<number, PointerInfo>>(new Map());
  const lastPinchDistanceRef = useRef<number | null>(null);
  const lastPanPosRef = useRef<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG設定
  const svgConfig = useMemo(() => ({
    width: 3000,
    height: 2600,
    centerX: 1500,
    centerY: 1300,
    centerRadius: 80,
    axisRadius: 65,
    stepRadius: 50,
    itemRadius: 45,
    axisDistance: 380,
    stepDistance: 180,
    itemDistance: 140,
    stepSpreadAngle: Math.PI * 0.5,
    itemSpreadBase: Math.PI * 0.4,
  }), []);

  // 初期フィット計算
  const calculateFitScale = useCallback(() => {
    if (!containerRef.current) return 1;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // コンテンツの実際のサイズ（軸ノードの外側まで含む）
    const contentWidth = svgConfig.axisDistance * 2 + svgConfig.axisRadius * 2 + 100;
    const contentHeight = svgConfig.axisDistance * 2 + svgConfig.axisRadius * 2 + 100;

    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;

    // 両方向に収まるスケール（少し余裕を持たせる）
    const fitScale = Math.min(scaleX, scaleY) * 0.85;

    // スケール範囲内にクランプ
    return Math.max(0.3, Math.min(5, fitScale));
  }, [svgConfig]);

  // フィットボタン押下時
  const handleFit = useCallback(() => {
    const fitScale = calculateFitScale();
    setScale(fitScale);
    setTranslate({ x: 0, y: 0 });
  }, [calculateFitScale]);

  // 初期表示時にフィット
  useEffect(() => {
    if (!loading && !initialFitDone && containerRef.current) {
      // 少し遅延させてコンテナサイズが確定してから計算
      const timer = setTimeout(() => {
        handleFit();
        setInitialFitDone(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, initialFitDone, handleFit]);

  // マインドマップ状態を取得
  const loadMindmapState = useCallback(async () => {
    try {
      setLoading(true);
      const { data, status } = await apiFetch<MindmapState>("/api/mindmap/state");

      if (status === 401) {
        clearAccessToken();
        router.replace("/login");
        return;
      }

      setMindmapState(data);
      setError(null);
    } catch (err) {
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadMindmapState();
  }, [loadMindmapState]);

  // ズーム操作
  const handleZoomIn = () => setScale((s) => Math.min(s * 1.25, 5));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.25, 0.3));
  const handleReset = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  // マウスホイールでズーム
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.3, Math.min(5, s * delta)));
  }, []);

  // 2点間の距離を計算
  const getDistance = (p1: PointerInfo, p2: PointerInfo): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 2点の中心を計算
  const getCenter = (p1: PointerInfo, p2: PointerInfo): { x: number; y: number } => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  };

  // ポインターダウン
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();

    const pointer: PointerInfo = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
    };

    pointersRef.current.set(e.pointerId, pointer);

    if (pointersRef.current.size === 1) {
      // 1本指: パン開始
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
    } else if (pointersRef.current.size === 2) {
      // 2本指: ピンチズーム開始
      const pointers = Array.from(pointersRef.current.values());
      lastPinchDistanceRef.current = getDistance(pointers[0], pointers[1]);
    }

    if (!isInteracting) {
      setIsInteracting(true);
      onInteractionStart?.();
    }

    // ポインターキャプチャ
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isInteracting, onInteractionStart]);

  // ポインター移動
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;

    // ポインター位置を更新
    pointersRef.current.set(e.pointerId, {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
    });

    const pointerCount = pointersRef.current.size;

    if (pointerCount === 1 && lastPanPosRef.current) {
      // 1本指: パン
      const dx = e.clientX - lastPanPosRef.current.x;
      const dy = e.clientY - lastPanPosRef.current.y;

      setTranslate((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
    } else if (pointerCount === 2 && lastPinchDistanceRef.current !== null) {
      // 2本指: ピンチズーム
      const pointers = Array.from(pointersRef.current.values());
      const currentDistance = getDistance(pointers[0], pointers[1]);
      const scaleFactor = currentDistance / lastPinchDistanceRef.current;

      setScale((prev) => {
        const newScale = prev * scaleFactor;
        return Math.max(0.3, Math.min(5, newScale));
      });

      lastPinchDistanceRef.current = currentDistance;
    }
  }, []);

  // ポインターアップ/キャンセル
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);

    // ポインターキャプチャ解除
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (pointersRef.current.size === 0) {
      lastPanPosRef.current = null;
      lastPinchDistanceRef.current = null;
      setIsInteracting(false);
      onInteractionEnd?.();
    } else if (pointersRef.current.size === 1) {
      // 2本→1本に減った: パンモードに切り替え
      const remaining = Array.from(pointersRef.current.values())[0];
      lastPanPosRef.current = { x: remaining.x, y: remaining.y };
      lastPinchDistanceRef.current = null;
    }
  }, [onInteractionEnd]);

  // 軸の展開/折りたたみ
  const toggleAxisExpand = (axisCode: string) => {
    setExpandedAxes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(axisCode)) {
        newSet.delete(axisCode);
        setExpandedSteps((steps) => {
          const newSteps = new Set(steps);
          Array.from(newSteps).forEach((key) => {
            if (key.startsWith(axisCode)) newSteps.delete(key);
          });
          return newSteps;
        });
      } else {
        newSet.add(axisCode);
      }
      return newSet;
    });
  };

  // STEPの展開/折りたたみ
  const toggleStepExpand = (axisCode: string, stepId: string) => {
    const key = `${axisCode}_${stepId}`;
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        Array.from(newSet).forEach((existingKey) => {
          if (existingKey.startsWith(`${axisCode}_`)) {
            newSet.delete(existingKey);
          }
        });
        newSet.add(key);
      }
      return newSet;
    });
  };

  // 項目クリック
  const handleItemClick = (axisCode: string, stepId: string, itemId: string) => {
    if (onNodeClick) {
      const nodeId = `${axisCode}_${stepId}_${itemId}`;
      onNodeClick(nodeId, axisCode);
    } else {
      router.push(`/deep_questions?axis=${axisCode}&cardId=${encodeURIComponent(itemId)}`);
    }
  };

  // 軸の位置計算
  const axisPositions = useMemo(() => {
    const axes = Object.entries(AXIS_CONFIG);
    const count = axes.length;
    const startAngle = -Math.PI / 2;

    return axes.map(([code, config], index) => {
      const angle = startAngle + (2 * Math.PI * index) / count;
      const x = svgConfig.centerX + Math.cos(angle) * svgConfig.axisDistance;
      const y = svgConfig.centerY + Math.sin(angle) * svgConfig.axisDistance;

      return {
        code,
        name: config.name,
        color: config.color,
        x,
        y,
        angle,
      };
    });
  }, [svgConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-sm text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-sm text-rose-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* ヘッダー（デスクトップ用） */}
      <div className="hidden sm:flex items-center justify-between px-4 py-2 border-b border-slate-200">
        <div>
          <h3 className="text-base font-semibold text-slate-900">進捗マップ</h3>
          <p className="text-xs text-slate-500">軸をクリックで展開 → STEPをクリック → 項目で深掘り</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            title="縮小"
          >
            <ZoomOut className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-xs text-slate-600 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            title="拡大"
          >
            <ZoomIn className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={handleFit}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            title="フィット"
          >
            <Maximize2 className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            title="100%"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* モバイル用ヘッダー */}
      <div className="flex sm:hidden items-center justify-between px-3 py-2 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">進捗マップ</h3>
          <p className="text-[10px] text-slate-500">ピンチでズーム・ドラッグで移動</p>
        </div>
      </div>

      {/* SVG Mindmap Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 relative"
        style={{ touchAction: "none" }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgConfig.width} ${svgConfig.height}`}
          className="w-full h-full"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "center center",
            cursor: isInteracting ? "grabbing" : "grab",
          }}
        >
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
            <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>

          {/* 中心から軸への線 */}
          {axisPositions.map((axis) => (
            <line
              key={`line-center-${axis.code}`}
              x1={svgConfig.centerX}
              y1={svgConfig.centerY}
              x2={axis.x}
              y2={axis.y}
              stroke={axis.color}
              strokeWidth="3"
              strokeOpacity="0.5"
            />
          ))}

          {/* 軸からSTEPへの線（展開時） */}
          {axisPositions.map((axis) => {
            if (!expandedAxes.has(axis.code)) return null;
            const steps = AXIS_STEPS[axis.code]?.steps || [];
            const stepCount = steps.length;

            return steps.map((step, stepIndex) => {
              const stepAngle = axis.angle - svgConfig.stepSpreadAngle / 2 + (svgConfig.stepSpreadAngle * stepIndex) / Math.max(stepCount - 1, 1);
              const stepX = axis.x + Math.cos(stepAngle) * svgConfig.stepDistance;
              const stepY = axis.y + Math.sin(stepAngle) * svgConfig.stepDistance;

              return (
                <line
                  key={`line-step-${axis.code}-${step.id}`}
                  x1={axis.x}
                  y1={axis.y}
                  x2={stepX}
                  y2={stepY}
                  stroke={axis.color}
                  strokeWidth="2"
                  strokeOpacity="0.4"
                />
              );
            });
          })}

          {/* STEPから項目への線（展開時） */}
          {axisPositions.map((axis) => {
            if (!expandedAxes.has(axis.code)) return null;
            const steps = AXIS_STEPS[axis.code]?.steps || [];
            const stepCount = steps.length;

            return steps.map((step, stepIndex) => {
              const stepKey = `${axis.code}_${step.id}`;
              if (!expandedSteps.has(stepKey)) return null;

              const stepAngle = axis.angle - svgConfig.stepSpreadAngle / 2 + (svgConfig.stepSpreadAngle * stepIndex) / Math.max(stepCount - 1, 1);
              const stepX = axis.x + Math.cos(stepAngle) * svgConfig.stepDistance;
              const stepY = axis.y + Math.sin(stepAngle) * svgConfig.stepDistance;

              const itemCount = step.items.length;
              const itemSpread = svgConfig.itemSpreadBase * Math.min(itemCount / 3, 1.5);

              return step.items.map((item, itemIndex) => {
                const itemAngle = stepAngle - itemSpread / 2 + (itemSpread * itemIndex) / Math.max(itemCount - 1, 1);
                const itemX = stepX + Math.cos(itemAngle) * svgConfig.itemDistance;
                const itemY = stepY + Math.sin(itemAngle) * svgConfig.itemDistance;

                return (
                  <line
                    key={`line-item-${axis.code}-${step.id}-${item.id}`}
                    x1={stepX}
                    y1={stepY}
                    x2={itemX}
                    y2={itemY}
                    stroke={axis.color}
                    strokeWidth="1.5"
                    strokeOpacity="0.3"
                  />
                );
              });
            });
          })}

          {/* 項目ノード（第3階層） */}
          {axisPositions.map((axis) => {
            if (!expandedAxes.has(axis.code)) return null;
            const steps = AXIS_STEPS[axis.code]?.steps || [];
            const stepCount = steps.length;

            return steps.map((step, stepIndex) => {
              const stepKey = `${axis.code}_${step.id}`;
              if (!expandedSteps.has(stepKey)) return null;

              const stepAngle = axis.angle - svgConfig.stepSpreadAngle / 2 + (svgConfig.stepSpreadAngle * stepIndex) / Math.max(stepCount - 1, 1);
              const stepX = axis.x + Math.cos(stepAngle) * svgConfig.stepDistance;
              const stepY = axis.y + Math.sin(stepAngle) * svgConfig.stepDistance;

              const itemCount = step.items.length;
              const itemSpread = svgConfig.itemSpreadBase * Math.min(itemCount / 3, 1.5);

              return step.items.map((item, itemIndex) => {
                const itemAngle = stepAngle - itemSpread / 2 + (itemSpread * itemIndex) / Math.max(itemCount - 1, 1);
                const itemX = stepX + Math.cos(itemAngle) * svgConfig.itemDistance;
                const itemY = stepY + Math.sin(itemAngle) * svgConfig.itemDistance;
                const isHovered = hoveredNode === `${axis.code}_${step.id}_${item.id}`;
                const colors = getStatusColors("pending");

                return (
                  <g
                    key={`item-${axis.code}-${step.id}-${item.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(axis.code, step.id, item.id);
                    }}
                    onPointerEnter={() => setHoveredNode(`${axis.code}_${step.id}_${item.id}`)}
                    onPointerLeave={() => setHoveredNode(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={itemX}
                      cy={itemY}
                      r={isHovered ? svgConfig.itemRadius + 3 : svgConfig.itemRadius}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth="2"
                      filter="url(#shadow)"
                    />
                    <text
                      x={itemX}
                      y={itemY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={colors.text}
                      fontSize="10"
                      fontWeight="500"
                    >
                      {item.title}
                    </text>
                  </g>
                );
              });
            });
          })}

          {/* STEPノード（第2階層） */}
          {axisPositions.map((axis) => {
            if (!expandedAxes.has(axis.code)) return null;
            const steps = AXIS_STEPS[axis.code]?.steps || [];
            const stepCount = steps.length;

            return steps.map((step, stepIndex) => {
              const stepAngle = axis.angle - svgConfig.stepSpreadAngle / 2 + (svgConfig.stepSpreadAngle * stepIndex) / Math.max(stepCount - 1, 1);
              const stepX = axis.x + Math.cos(stepAngle) * svgConfig.stepDistance;
              const stepY = axis.y + Math.sin(stepAngle) * svgConfig.stepDistance;
              const stepKey = `${axis.code}_${step.id}`;
              const isExpanded = expandedSteps.has(stepKey);
              const isHovered = hoveredNode === stepKey;

              return (
                <g
                  key={`step-${axis.code}-${step.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStepExpand(axis.code, step.id);
                  }}
                  onPointerEnter={() => setHoveredNode(stepKey)}
                  onPointerLeave={() => setHoveredNode(null)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={stepX}
                    cy={stepY}
                    r={isHovered ? svgConfig.stepRadius + 3 : svgConfig.stepRadius}
                    fill={isExpanded ? axis.color : "#ffffff"}
                    stroke={axis.color}
                    strokeWidth="2"
                    filter="url(#shadow)"
                  />
                  <text
                    x={stepX}
                    y={stepY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isExpanded ? "#ffffff" : axis.color}
                    fontSize="12"
                    fontWeight="600"
                  >
                    {step.name}
                  </text>
                </g>
              );
            });
          })}

          {/* 軸ノード（第1階層） */}
          {axisPositions.map((axis) => {
            const isExpanded = expandedAxes.has(axis.code);
            const isHovered = hoveredNode === axis.code;
            const isSelected = selectedAxis === axis.code;

            return (
              <g
                key={`axis-${axis.code}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAxisExpand(axis.code);
                }}
                onPointerEnter={() => setHoveredNode(axis.code)}
                onPointerLeave={() => setHoveredNode(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={axis.x}
                  cy={axis.y}
                  r={isHovered || isSelected ? svgConfig.axisRadius + 5 : svgConfig.axisRadius}
                  fill={axis.color}
                  stroke={isExpanded ? "#1e40af" : axis.color}
                  strokeWidth={isExpanded ? "4" : "2"}
                  filter="url(#shadow)"
                />
                <text
                  x={axis.x}
                  y={axis.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  fontSize="13"
                  fontWeight="600"
                >
                  {axis.name}
                </text>
                <text
                  x={axis.x}
                  y={axis.y + svgConfig.axisRadius + 14}
                  textAnchor="middle"
                  fill={axis.color}
                  fontSize="12"
                >
                  {isExpanded ? "▲" : "▼"}
                </text>
              </g>
            );
          })}

          {/* 中心ノード */}
          <g>
            <circle
              cx={svgConfig.centerX}
              cy={svgConfig.centerY}
              r={svgConfig.centerRadius}
              fill="url(#centerGradient)"
              filter="url(#shadow)"
            />
            <text
              x={svgConfig.centerX}
              y={svgConfig.centerY - 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="16"
              fontWeight="700"
            >
              開業
            </text>
            <text
              x={svgConfig.centerX}
              y={svgConfig.centerY + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="16"
              fontWeight="700"
            >
              プラン
            </text>
          </g>
        </svg>
      </div>

      {/* モバイル用フローティングコントロール */}
      <div className="absolute bottom-16 right-3 flex flex-col gap-1 sm:hidden">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg bg-white/90 shadow-md border border-slate-200 active:bg-slate-100"
        >
          <ZoomIn className="w-5 h-5 text-slate-700" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg bg-white/90 shadow-md border border-slate-200 active:bg-slate-100"
        >
          <ZoomOut className="w-5 h-5 text-slate-700" />
        </button>
        <button
          onClick={handleFit}
          className="p-2 rounded-lg bg-white/90 shadow-md border border-slate-200 active:bg-slate-100"
        >
          <Maximize2 className="w-5 h-5 text-slate-700" />
        </button>
        <div className="px-2 py-1 rounded-lg bg-white/90 shadow-md border border-slate-200 text-center">
          <span className="text-xs font-medium text-slate-700">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 py-2 sm:py-3 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white border-2 border-slate-300" />
          <span className="text-[10px] sm:text-xs text-slate-600">未開始</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500" />
          <span className="text-[10px] sm:text-xs text-slate-600">進行中</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
          <span className="text-[10px] sm:text-xs text-slate-600">完了</span>
        </div>
      </div>
    </div>
  );
}

export default MindmapSVG;
