import {
  Beer,
  Building,
  Camera,
  ChefHat,
  Clock3,
  Coffee,
  CookingPot,
  Drumstick,
  Flame,
  Home,
  Martini,
  Pizza,
  Soup,
  Store,
  Sun,
  Sunrise,
  Sunset,
  TrainFront,
  Trees,
  Wallet,
  Wine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AnswerType = "single" | "multi";

export type QuestionId =
  | "main_genre"
  | "sub_genre"
  | "seats"
  | "price_range"
  | "price_point"
  | "business_hours"
  | "location";

export type QuestionOption = {
  value: string;
  label: string;
  isUnknown?: boolean;
};

export type SliderConfig = {
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
};

export type Question = {
  id: QuestionId;
  number: number;
  title: string;
  prompt: string;
  type: AnswerType;
  options: QuestionOption[];
  slider?: SliderConfig;
};

export type MainGenreValue =
  | "izakaya"
  | "japanese"
  | "yakitori"
  | "yakiniku"
  | "ramen"
  | "curry_ethnic"
  | "italian"
  | "french"
  | "cafe"
  | "sweets"
  | "bar"
  | "bistro";

export const OPTION_ICONS: Record<string, LucideIcon> = {
  // メインジャンル
  izakaya: Beer,
  japanese: Soup,
  yakitori: Drumstick,
  yakiniku: Flame,
  ramen: Soup,
  curry_ethnic: CookingPot,
  italian: Pizza,
  french: ChefHat,
  cafe: Coffee,
  sweets: Camera,
  bar: Martini,
  bistro: Wine,

  // 客単価レンジ
  price_0_2000: Wallet,
  price_2000_4000: Wallet,
  price_4000_6000: Wallet,
  price_6000_8000: Wallet,
  price_8000_10000: Wallet,
  price_10000_12000: Wallet,

  // 営業時間帯
  morning_to_lunch: Sunrise,
  lunch_to_cafe: Sun,
  dinner: Sunset,
  dinner_to_midnight: Clock3,
  late_night: Martini,
  all_day: Clock3,

  // 立地
  near_station: TrainFront,
  office_area: Building,
  residential_area: Home,
  shopping_street: Store,
  tourist_area: Camera,
  suburban: Trees,
};

export const SUB_GENRE_OPTIONS_BY_MAIN: Record<
  MainGenreValue,
  QuestionOption[]
> = {
  izakaya: [
    {
      value: "izakaya_taishu",
      label: "大衆酒場・せんべろ系",
    },
    {
      value: "izakaya_neo",
      label: "ネオ居酒屋・おしゃれ酒場",
    },
    {
      value: "izakaya_seafood",
      label: "魚介系居酒屋（刺身・海鮮メイン）",
    },
    {
      value: "izakaya_meat",
      label: "肉・串焼きメインの居酒屋",
    },
    {
      value: "izakaya_sake",
      label: "日本酒メインの居酒屋",
    },
    {
      value: "izakaya_shochu",
      label: "焼酎・ハイボールメインの居酒屋",
    },
  ],
  japanese: [
    {
      value: "washoku_teishoku",
      label: "定食屋・街のごはん屋さん",
    },
    {
      value: "washoku_sushi",
      label: "寿司・海鮮丼中心",
    },
    {
      value: "washoku_udon_soba",
      label: "うどん・そば中心",
    },
    {
      value: "washoku_obanzai",
      label: "おばんざい・家庭料理",
    },
    {
      value: "washoku_nabe",
      label: "しゃぶしゃぶ・鍋料理",
    },
    {
      value: "washoku_kappo",
      label: "小料理・割烹スタイル",
    },
  ],
  yakitori: [
    {
      value: "yakitori_counter",
      label: "カウンター中心の焼き鳥専門店",
    },
    {
      value: "yakitori_kushikatsu",
      label: "串カツ・揚げ串メイン",
    },
    {
      value: "yakitori_buffet",
      label: "焼き鳥食べ放題・コース中心",
    },
    {
      value: "yakitori_pairing",
      label: "ワイン・日本酒ペアリング重視",
    },
    {
      value: "yakitori_takeout",
      label: "持ち帰り中心の焼き鳥店",
    },
    {
      value: "yakitori_standing",
      label: "立ち飲みスタイルの焼き鳥店",
    },
  ],
  yakiniku: [
    {
      value: "yakiniku_family",
      label: "ファミリー向け焼肉店",
    },
    {
      value: "yakiniku_premium",
      label: "高級焼肉・接待向け",
    },
    {
      value: "yakiniku_single",
      label: "一人焼肉専門",
    },
    {
      value: "yakiniku_horumon",
      label: "ホルモン・内臓系メイン",
    },
    {
      value: "yakiniku_buffet",
      label: "食べ放題・コース中心",
    },
    {
      value: "yakiniku_izakaya_mix",
      label: "焼肉＋居酒屋的つまみ",
    },
  ],
  ramen: [
    {
      value: "ramen_tonkotsu",
      label: "濃厚とんこつ",
    },
    {
      value: "ramen_shio_shoyu",
      label: "あっさり塩・醤油",
    },
    {
      value: "ramen_toripaitan",
      label: "鶏白湯",
    },
    {
      value: "ramen_tsukemen",
      label: "つけ麺メイン",
    },
    {
      value: "ramen_tantanmen",
      label: "担々麺・辛い系",
    },
    {
      value: "ramen_chinese_general",
      label: "中華料理全般も扱う",
    },
  ],
  curry_ethnic: [
    {
      value: "curry_oufu",
      label: "欧風カレー専門",
    },
    {
      value: "curry_spice",
      label: "スパイスカレー専門",
    },
    {
      value: "curry_indian",
      label: "インド・ネパール系カレー",
    },
    {
      value: "curry_thai",
      label: "タイカレー・タイ料理",
    },
    {
      value: "curry_asian_noodle",
      label: "アジアン麺（フォー・ラクサ等）",
    },
    {
      value: "curry_asian_izakaya",
      label: "アジアン居酒屋スタイル",
    },
  ],
  italian: [
    {
      value: "italian_pizza",
      label: "ピッツァメイン（ピッツェリア）",
    },
    {
      value: "italian_pasta",
      label: "パスタメイン",
    },
    {
      value: "italian_trattoria",
      label: "カジュアルイタリアン（トラットリア）",
    },
    {
      value: "italian_winebar",
      label: "ワインバー寄りのイタリアン",
    },
    {
      value: "italian_deli",
      label: "デリ・惣菜併設のイタリアン",
    },
    {
      value: "italian_course",
      label: "コース中心の少し特別な店",
    },
  ],
  french: [
    {
      value: "french_bistro",
      label: "ビストロフレンチ（カジュアル）",
    },
    {
      value: "french_winebar",
      label: "ワインバー＋小皿フレンチ",
    },
    {
      value: "french_classic",
      label: "クラシックフレンチ（コース中心）",
    },
    {
      value: "french_galette",
      label: "ガレット・クレープ中心",
    },
    {
      value: "french_deli",
      label: "シャルキュトリー・惣菜系フレンチ",
    },
    {
      value: "french_mix",
      label: "フレンチと他ジャンルのミックス",
    },
  ],
  cafe: [
    {
      value: "cafe_coffee_stand",
      label: "コーヒースタンド・エスプレッソバー",
    },
    {
      value: "cafe_junkissa",
      label: "純喫茶スタイル",
    },
    {
      value: "cafe_bakery",
      label: "ベーカリーカフェ",
    },
    {
      value: "cafe_lunch",
      label: "ランチプレート・定食系カフェ",
    },
    {
      value: "cafe_night",
      label: "夜カフェ・アルコール提供あり",
    },
    {
      value: "cafe_takeout",
      label: "テイクアウト中心のカフェ",
    },
  ],
  sweets: [
    {
      value: "sweets_patisserie",
      label: "ケーキ・焼き菓子のパティスリー",
    },
    {
      value: "sweets_parfait",
      label: "パフェ・デザートカフェ",
    },
    {
      value: "sweets_wagashi",
      label: "和菓子・団子・大福",
    },
    {
      value: "sweets_crepe",
      label: "クレープ・ワッフル専門",
    },
    {
      value: "sweets_ice",
      label: "ソフトクリーム・ジェラート",
    },
    {
      value: "sweets_gift",
      label: "テイクアウト・ギフト中心",
    },
  ],
  bar: [
    {
      value: "bar_cocktail",
      label: "カクテルバー",
    },
    {
      value: "bar_whisky",
      label: "ウイスキーバー",
    },
    {
      value: "bar_wine",
      label: "ワインバー",
    },
    {
      value: "bar_sake",
      label: "日本酒バー",
    },
    {
      value: "bar_standing",
      label: "スタンディングバー",
    },
    {
      value: "bar_music",
      label: "音楽バー・ライブバー",
    },
  ],
  bistro: [
    {
      value: "bistro_multinational",
      label: "多国籍・アジアンミックス",
    },
    {
      value: "bistro_fusion",
      label: "和洋折衷の創作料理",
    },
    {
      value: "bistro_buffet",
      label: "ビュッフェ・惣菜系レストラン",
    },
    {
      value: "bistro_foodcourt",
      label: "フードコート・間借り出店",
    },
    {
      value: "bistro_ghost",
      label: "ゴーストキッチン・デリバリー中心",
    },
    {
      value: "bistro_popup",
      label: "ポップアップ・イベント出店メイン",
    },
  ],
};

export const PRICE_RANGE_BOUNDS: Record<
  string,
  { min: number; max: number }
> = {
  price_0_2000: { min: 0, max: 2000 },
  price_2000_4000: { min: 2000, max: 4000 },
  price_4000_6000: { min: 4000, max: 6000 },
  price_6000_8000: { min: 6000, max: 8000 },
  price_8000_10000: { min: 8000, max: 10000 },
  price_10000_12000: { min: 10000, max: 12000 },
};

export const QUESTIONS: Question[] = [
  {
    id: "main_genre",
    number: 1,
    title: "メインジャンル",
    prompt:
      "どんなジャンルのお店としてスタートしたいですか？一番近いものを 1 つ選んでください。",
    type: "single",
    options: [
      { value: "izakaya", label: "居酒屋・酒場" },
      { value: "japanese", label: "和食・定食" },
      { value: "yakitori", label: "焼き鳥・串焼き" },
      { value: "yakiniku", label: "焼肉・ホルモン" },
      { value: "ramen", label: "ラーメン・つけ麺" },
      { value: "curry_ethnic", label: "カレー・エスニック" },
      { value: "italian", label: "イタリアン" },
      { value: "french", label: "フレンチ・ビストロ" },
      { value: "cafe", label: "カフェ・喫茶" },
      { value: "sweets", label: "スイーツ・デザート" },
      { value: "bar", label: "バー・ワインバー" },
      { value: "bistro", label: "多国籍・創作系" },
    ],
  },
  {
    id: "sub_genre",
    number: 2,
    title: "サブジャンル（メインジャンルの深掘り）",
    prompt:
      "さきほど選んだジャンルについて、どのスタイルが一番近いですか？イメージに近いものを 1 つ選んでください。",
    type: "single",
    // 実際の選択肢は SUB_GENRE_OPTIONS_BY_MAIN を使用して、
    // main_genre の回答に応じて出し分ける。
    options: [],
  },
  {
    id: "seats",
    number: 3,
    title: "座席数",
    prompt:
      "店内には、だいたい何席くらいをイメージしていますか？（カウンター・テーブル席を合わせた合計）",
    type: "single",
    options: [],
    slider: {
      min: 4,
      max: 60,
      step: 1,
      unit: "席",
      defaultValue: 20,
    },
  },
  {
    id: "price_range",
    number: 4,
    title: "想定客単価のレンジ",
    prompt:
      "1 人あたり（ドリンク込み）の想定客単価のレンジを、イメージに一番近いものから 1 つ選んでください。",
    type: "single",
    options: [
      { value: "price_0_2000", label: "〜 2,000 円（低単価帯）" },
      { value: "price_2000_4000", label: "2,000 〜 4,000 円" },
      { value: "price_4000_6000", label: "4,000 〜 6,000 円" },
      { value: "price_6000_8000", label: "6,000 〜 8,000 円" },
      { value: "price_8000_10000", label: "8,000 〜 10,000 円" },
      { value: "price_10000_12000", label: "10,000 〜 12,000 円" },
    ],
  },
  {
    id: "price_point",
    number: 5,
    title: "想定客単価（具体的な金額）",
    prompt:
      "1 人あたりの想定客単価を、より具体的な金額で教えてください。（先ほど選んだレンジの中で、100 円単位で調整）",
    type: "single",
    options: [],
    slider: {
      min: 500,
      max: 12000,
      step: 100,
      unit: "円",
      defaultValue: 3000,
    },
  },
  {
    id: "business_hours",
    number: 6,
    title: "営業時間帯",
    prompt: "メインの営業時間帯は、どの時間帯のイメージが近いですか？",
    type: "single",
    options: [
      {
        value: "morning_to_lunch",
        label: "朝 〜 ランチ（7〜14 時ごろ）",
      },
      {
        value: "lunch_to_cafe",
        label: "ランチ 〜 カフェ（11〜17 時ごろ）",
      },
      {
        value: "dinner",
        label: "ディナー中心（17〜23 時ごろ）",
      },
      {
        value: "dinner_to_midnight",
        label: "ディナー 〜 深夜（17〜翌 2 時ごろ）",
      },
      {
        value: "late_night",
        label: "深夜営業がメイン（22 時以降が中心）",
      },
      {
        value: "all_day",
        label: "昼も夜も通しで営業する",
      },
    ],
  },
  {
    id: "location",
    number: 7,
    title: "立地のイメージ",
    prompt:
      "出店したい場所のイメージとして、一番近いものを 1 つ選んでください。",
    type: "single",
    options: [
      {
        value: "near_station",
        label: "駅近（徒歩 5 分以内）のエリア",
      },
      {
        value: "office_area",
        label: "オフィス街・ビジネス街",
      },
      {
        value: "residential_area",
        label: "住宅街・地元の生活圏",
      },
      {
        value: "shopping_street",
        label: "商店街・アーケード",
      },
      {
        value: "tourist_area",
        label: "観光地・繁華街エリア",
      },
      {
        value: "suburban",
        label: "郊外・ロードサイド",
      },
    ],
  },
];

export const QUESTION_TOTAL = QUESTIONS.length;

export function getQuestionByNumber(
  questionNumber: number,
): Question | undefined {
  return QUESTIONS.find((question) => question.number === questionNumber);
}

