/**
 * 価格レンジの定義とユーティリティ関数
 */

export type PriceRangeKey =
  | "price_0_2000"
  | "price_2000_4000"
  | "price_4000_6000"
  | "price_6000_8000"
  | "price_8000_10000"
  | "price_10000_15000"
  | "price_15000_20000"
  | "price_20000_plus";

export type PriceRangeBounds = {
  min: number;
  max: number;
  isHighEnd?: boolean;
};

/**
 * 価格レンジの定義
 * 各レンジのmin/max値と表示ラベルを含む
 */
export const PRICE_RANGES: Record<PriceRangeKey, { label: string; bounds: PriceRangeBounds }> = {
  price_0_2000: {
    label: "〜2,000円",
    bounds: { min: 0, max: 2000 },
  },
  price_2000_4000: {
    label: "2,000〜4,000円",
    bounds: { min: 2000, max: 4000 },
  },
  price_4000_6000: {
    label: "4,000〜6,000円",
    bounds: { min: 4000, max: 6000 },
  },
  price_6000_8000: {
    label: "6,000〜8,000円",
    bounds: { min: 6000, max: 8000 },
  },
  price_8000_10000: {
    label: "8,000〜10,000円",
    bounds: { min: 8000, max: 10000 },
  },
  price_10000_15000: {
    label: "10,000〜15,000円",
    bounds: { min: 10000, max: 15000 },
  },
  price_15000_20000: {
    label: "15,000〜20,000円",
    bounds: { min: 15000, max: 20000 },
  },
  price_20000_plus: {
    label: "20,000円以上",
    bounds: { min: 20000, max: 30000, isHighEnd: true },
  },
};

/**
 * 価格レンジの境界値マップ（後方互換性のため）
 */
export const PRICE_RANGE_BOUNDS: Record<string, PriceRangeBounds> = Object.fromEntries(
  Object.entries(PRICE_RANGES).map(([key, value]) => [key, value.bounds]),
);

/**
 * 価格レンジの選択肢（質問フォーム用）
 */
export const PRICE_RANGE_OPTIONS = Object.entries(PRICE_RANGES).map(([value, { label }]) => ({
  value,
  label,
}));

/**
 * スライダーの設定
 */
export const PRICE_SLIDER_CONFIG = {
  min: 500,
  max: 30000,
  step: 500,
  unit: "円",
} as const;

/**
 * 数値を通貨形式（カンマ区切り）でフォーマット
 * @param value 数値
 * @returns フォーマットされた文字列（例: "¥1,000"）
 */
export function formatCurrency(value: number): string {
  return `¥${value.toLocaleString()}`;
}

/**
 * 価格レンジのmin/maxからスライダーの初期値を計算
 * 初期値 = (min + max) / 2 を四捨五入して500円刻みにした値
 * @param bounds 価格レンジの境界値
 * @returns スライダーの初期値（500円刻み）
 */
export function calculateSliderInitialValue(bounds: PriceRangeBounds): number {
  const midpoint = (bounds.min + bounds.max) / 2;
  // 500円刻みに四捨五入
  return Math.round(midpoint / PRICE_SLIDER_CONFIG.step) * PRICE_SLIDER_CONFIG.step;
}

/**
 * スライダーの値を500円刻みにクランプ
 * @param value 入力値
 * @returns クランプされた値（500〜30,000の範囲内、500円刻み）
 */
export function clampSliderValue(value: number): number {
  const clamped = Math.max(PRICE_SLIDER_CONFIG.min, Math.min(PRICE_SLIDER_CONFIG.max, value));
  // 500円刻みに丸める
  return Math.round(clamped / PRICE_SLIDER_CONFIG.step) * PRICE_SLIDER_CONFIG.step;
}



