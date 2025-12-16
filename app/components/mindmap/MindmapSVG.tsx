"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
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

export function MindmapSVG({ selectedAxis, onNodeClick }: MindmapSVGProps) {
  const router = useRouter();
  const [mindmapState, setMindmapState] = useState<MindmapState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [expandedAxes, setExpandedAxes] = useState<Set<string>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

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

  // ズーム操作（最大500%まで）
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // マウスホイールでズーム（最大500%まで）
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.3, Math.min(5, z + delta)));
  }, []);

  // ドラッグでパン
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = () => setIsDragging(false);

  // 軸の展開/折りたたみ
  const toggleAxisExpand = (axisCode: string) => {
    setExpandedAxes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(axisCode)) {
        newSet.delete(axisCode);
        // 軸を閉じたらその下のSTEPも閉じる
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

  // STEPの展開/折りたたみ（同じ軸内ではアコーディオン式：1つだけ開く）
  const toggleStepExpand = (axisCode: string, stepId: string) => {
    const key = `${axisCode}_${stepId}`;
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        // 既に開いている場合は閉じる
        newSet.delete(key);
      } else {
        // 同じ軸内の他のSTEPを閉じてから開く
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

  // 項目クリック → 深掘りページのチャットモーダルへ直接遷移
  const handleItemClick = (axisCode: string, stepId: string, itemId: string) => {
    if (onNodeClick) {
      const nodeId = `${axisCode}_${stepId}_${itemId}`;
      onNodeClick(nodeId, axisCode);
    } else {
      // cardIdパラメータを追加してチャットモーダルが自動で開くようにする
      router.push(`/deep_questions?axis=${axisCode}&cardId=${encodeURIComponent(itemId)}`);
    }
  };

  // SVG設定（より広いスペースを確保）
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
    // スプレッド角度の設定（統一）
    stepSpreadAngle: Math.PI * 0.5, // STEPの広がり角度
    itemSpreadBase: Math.PI * 0.4,  // 項目の基本広がり角度
  }), []);

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
    <div className="h-full flex flex-col">
      {/* ヘッダー＆ズームコントロール */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200">
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
          <span className="text-xs text-slate-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            title="拡大"
          >
            <ZoomIn className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            title="リセット"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* SVG Mindmap */}
      <div
        className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgConfig.width} ${svgConfig.height}`}
          className="w-full h-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
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
              // 項目数に応じてスプレッド角度を調整（適度な広がり）
              const itemSpread = svgConfig.itemSpreadBase * Math.min(itemCount / 3, 1.5);

              return step.items.map((item, itemIndex) => {
                // 項目はSTEPの外側に放射状に配置
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
              // 項目数に応じてスプレッド角度を調整（線と同じ計算式）
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
                    onMouseEnter={() => setHoveredNode(`${axis.code}_${step.id}_${item.id}`)}
                    onMouseLeave={() => setHoveredNode(null)}
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
                  onMouseEnter={() => setHoveredNode(stepKey)}
                  onMouseLeave={() => setHoveredNode(null)}
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
                onMouseEnter={() => setHoveredNode(axis.code)}
                onMouseLeave={() => setHoveredNode(null)}
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
                {/* 展開インジケーター */}
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

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-6 py-3 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-300" />
          <span className="text-xs text-slate-600">未開始</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-slate-600">進行中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-slate-600">完了</span>
        </div>
      </div>
    </div>
  );
}

export default MindmapSVG;
