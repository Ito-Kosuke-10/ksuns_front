// マインドマップのノード状態
export type NodeStatus = "pending" | "in_progress" | "completed";

// 個別ノードの状態
export type MindmapNode = {
  node_id: string;
  axis_code: string;
  card_id: string;
  title: string;
  status: NodeStatus;
  summary: string | null;
};

// 軸ごとのノード一覧
export type AxisNodes = {
  axis_code: string;
  axis_name: string;
  nodes: MindmapNode[];
};

// マインドマップ全体の状態（API レスポンス）
export type MindmapState = {
  axes: AxisNodes[];
};

// 軸の定義
export const AXIS_CONFIG: Record<string, { name: string; color: string }> = {
  concept: { name: "コンセプト", color: "#0ea5e9" },
  revenue_forecast: { name: "収支予測", color: "#8b5cf6" },
  funding_plan: { name: "資金計画", color: "#10b981" },
  location: { name: "立地", color: "#f59e0b" },
  interior_exterior: { name: "内装外装", color: "#ec4899" },
  menu: { name: "メニュー", color: "#ef4444" },
  operation: { name: "オペレーション", color: "#6366f1" },
  marketing: { name: "販促", color: "#14b8a6" },
};

// ノードの色定義
export const NODE_COLORS = {
  pending: {
    fill: "#f1f5f9",
    stroke: "#cbd5e1",
    text: "#64748b",
  },
  in_progress: {
    fill: "#fef3c7",
    stroke: "#f59e0b",
    text: "#92400e",
  },
  completed: {
    fill: "#dcfce7",
    stroke: "#22c55e",
    text: "#166534",
  },
};
