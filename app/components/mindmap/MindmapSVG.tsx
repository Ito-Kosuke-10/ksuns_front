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

// 各軸のSTEPとその項目を定義
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

export function MindmapSVG({ selectedAxis, onNodeClick, onInteractionStart, onInteractionEnd }: MindmapSVGProps) {
  const router = useRouter();
  const [mindmapState, setMindmapState] = useState<MindmapState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [expandedAxes, setExpandedAxes] = useState<Set<string>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // ズーム・パン状態（初期値260%、最大1000%）
  const [scale, setScale] = useState(2.6);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  // タッチ管理
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const touchCountRef = useRef(0);

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

  // フィットボタン押下時（初期表示に戻す）
  const handleFit = useCallback(() => {
    setScale(2.6);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // 初期表示時にフィット
  useEffect(() => {
    if (!loading) {
      handleFit();
    }
  }, [loading, handleFit]);

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

  // ノードをズームして中央に表示（570%）
  const zoomToNode = useCallback((nodeX: number, nodeY: number) => {
    if (!containerRef.current) return;

    const targetScale = 5.7; // 570%
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // viewBoxからコンテナへの変換比率を計算
    const viewBoxWidth = svgConfig.width; // 3000
    const viewBoxHeight = svgConfig.height; // 2600
    const baseScale = Math.min(containerWidth / viewBoxWidth, containerHeight / viewBoxHeight);

    // SVG中心からノードまでのオフセット（viewBox座標系）
    const offsetX = nodeX - svgConfig.centerX;
    const offsetY = nodeY - svgConfig.centerY;

    // viewBox座標をスクリーン座標に変換し、スケールを適用
    setScale(targetScale);
    setTranslate({
      x: -offsetX * baseScale * targetScale,
      y: -offsetY * baseScale * targetScale,
    });
  }, [svgConfig]);

  // ズーム操作（最大1000%、最小30%）
  const handleZoomIn = useCallback(() => setScale((s) => Math.min(s * 1.3, 10)), []);
  const handleZoomOut = useCallback(() => setScale((s) => Math.max(s / 1.3, 0.3)), []);
  const handleReset = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // マウスホイールでズーム
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.3, Math.min(10, s * delta)));
  }, []);

  // 2点間の距離を計算
  const getDistance = (t1: React.Touch, t2: React.Touch): number => {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // タッチ開始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    touchCountRef.current = e.touches.length;

    if (e.touches.length === 1) {
      // 1本指: パン開始
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      lastPinchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      // 2本指: ピンチズーム開始
      lastPinchDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
      lastTouchRef.current = null;
    }

    if (!isInteracting) {
      setIsInteracting(true);
      onInteractionStart?.();
    }
  }, [isInteracting, onInteractionStart]);

  // タッチ移動
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && lastTouchRef.current) {
      // 1本指: パン
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;

      setTranslate((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if (e.touches.length === 2 && lastPinchDistanceRef.current !== null) {
      // 2本指: ピンチズーム
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scaleFactor = currentDistance / lastPinchDistanceRef.current;

      setScale((prev) => {
        const newScale = prev * scaleFactor;
        return Math.max(0.3, Math.min(10, newScale));
      });

      lastPinchDistanceRef.current = currentDistance;
    }
  }, []);

  // タッチ終了
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      lastTouchRef.current = null;
      lastPinchDistanceRef.current = null;
      touchCountRef.current = 0;
      setIsInteracting(false);
      onInteractionEnd?.();
    } else if (e.touches.length === 1) {
      // 2本→1本に減った: パンモードに切り替え
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      lastPinchDistanceRef.current = null;
      touchCountRef.current = 1;
    }
  }, [onInteractionEnd]);

  // マウスドラッグ（デスクトップ用）
  const [isDragging, setIsDragging] = useState(false);
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      setIsInteracting(true);
      onInteractionStart?.();
    }
  }, [onInteractionStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && lastMouseRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;

      setTranslate((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      lastMouseRef.current = null;
      setIsInteracting(false);
      onInteractionEnd?.();
    }
  }, [isDragging, onInteractionEnd]);

  // 軸の展開/折りたたみ（展開時は570%ズームして中央表示）
  const toggleAxisExpand = useCallback((axisCode: string, axisX?: number, axisY?: number) => {
    setExpandedAxes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(axisCode)) {
        // 折りたたみ時
        newSet.delete(axisCode);
        setExpandedSteps((steps) => {
          const newSteps = new Set(steps);
          Array.from(newSteps).forEach((key) => {
            if (key.startsWith(axisCode)) newSteps.delete(key);
          });
          return newSteps;
        });
      } else {
        // 展開時は570%ズームして中央に
        newSet.add(axisCode);
        if (axisX !== undefined && axisY !== undefined) {
          zoomToNode(axisX, axisY);
        }
      }
      return newSet;
    });
  }, [zoomToNode]);

  // STEPの展開/折りたたみ
  const toggleStepExpand = useCallback((axisCode: string, stepId: string) => {
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
  }, []);

  // 項目クリック
  const handleItemClick = useCallback((axisCode: string, stepId: string, itemId: string) => {
    if (onNodeClick) {
      const nodeId = `${axisCode}_${stepId}_${itemId}`;
      onNodeClick(nodeId, axisCode);
    } else {
      router.push(`/deep_questions?axis=${axisCode}&cardId=${encodeURIComponent(itemId)}`);
    }
  }, [onNodeClick, router]);

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
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-sm text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <p className="text-sm text-rose-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* ヘッダー（デスクトップ用） */}
      <div className="hidden sm:flex items-center justify-between px-4 py-2 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-semibold text-slate-900">進捗マップ</h3>
          {/* 凡例 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-300" />
              <span className="text-[10px] text-slate-500">未開始</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-[10px] text-slate-500">進行中</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-slate-500">完了</span>
            </div>
          </div>
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

      {/* モバイル用ヘッダー（凡例を中央に配置） */}
      <div className="flex sm:hidden items-center justify-between px-3 py-2 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">進捗マップ</h3>
        {/* 凡例（中央） */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white border border-slate-300" />
            <span className="text-[9px] text-slate-500">未開始</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[9px] text-slate-500">進行中</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[9px] text-slate-500">完了</span>
          </div>
        </div>
      </div>

      {/* SVG Mindmap Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 relative"
        style={{ touchAction: "none" }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
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
                  toggleAxisExpand(axis.code, axis.x, axis.y);
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
      <div className="absolute bottom-3 right-3 flex flex-col gap-1 sm:hidden">
        <button
          onClick={handleZoomIn}
          className="p-2.5 rounded-lg bg-white/95 shadow-lg border border-slate-200 active:bg-slate-100"
        >
          <ZoomIn className="w-5 h-5 text-slate-700" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 rounded-lg bg-white/95 shadow-lg border border-slate-200 active:bg-slate-100"
        >
          <ZoomOut className="w-5 h-5 text-slate-700" />
        </button>
        <button
          onClick={handleFit}
          className="p-2.5 rounded-lg bg-white/95 shadow-lg border border-slate-200 active:bg-slate-100"
        >
          <Maximize2 className="w-5 h-5 text-slate-700" />
        </button>
        <div className="px-2 py-1.5 rounded-lg bg-white/95 shadow-lg border border-slate-200 text-center">
          <span className="text-xs font-medium text-slate-700">{Math.round(scale * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

export default MindmapSVG;
