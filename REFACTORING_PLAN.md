# フロントエンド リファクタリング計画

## 1. 現状のディレクトリ構成と責務の整理

### 現在の構成

```
ksuns_front/
├── app/                          # Next.js App Router のページ
│   ├── page.tsx                  # トップページ（簡易シミュレーション開始）
│   ├── layout.tsx                # ルートレイアウト
│   ├── login/                    # ログインページ
│   ├── dashboard/                # ダッシュボード（425行の巨大コンポーネント）
│   ├── chat/                     # チャットページ（ハリボテ）
│   ├── detail_questions/         # 詳細質問ページ
│   ├── deep_questions/           # 深掘り質問ページ
│   ├── summaries/                # サマリー生成ページ
│   ├── report/                   # レポートページ（ハリボテ）
│   ├── axes/                     # 軸詳細ページ
│   ├── auth/callback/            # 認証コールバック
│   └── simple_simulation/        # 簡易シミュレーション
│       ├── questions/[questionNumber]/  # 質問ページ
│       ├── result/               # 結果ページ
│       ├── components/           # ⚠️ ページ配下にコンポーネント（問題）
│       │   ├── ChoiceCard.tsx
│       │   └── ProgressBar.tsx
│       ├── data/                 # 質問データ
│       │   └── questions.ts
│       └── state/                # 状態管理（Context）
│           └── answer-context.tsx
├── components/
│   └── ui/                       # 再利用可能なUIコンポーネント
│       ├── alert.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── container.tsx
└── lib/                          # ユーティリティ・APIクライアント
    ├── api-client.ts             # API呼び出し関数
    ├── auth-token.ts             # トークン管理
    └── storage.ts                # ストレージユーティリティ
```

### 責務の整理

| ディレクトリ | 責務 | 問題点 |
|------------|------|--------|
| `app/` | ページコンポーネント（ルーティング） | 一部ページが巨大（dashboard 425行）<br>型定義が各ページに散在 |
| `app/simple_simulation/components/` | シミュレーション専用コンポーネント | ページ配下に配置（再利用しにくい） |
| `components/ui/` | 汎用UIコンポーネント | 問題なし |
| `lib/` | ユーティリティ・API | 型定義がない<br>エラーハンドリングが各ページで重複 |

---

## 2. 気になるアンチパターンや技術的負債

### 🔴 高優先度

#### 2.1 型定義の散在
- **問題**: APIレスポンス型が各ページで個別定義されている
  - `dashboard/page.tsx`: `DashboardData`, `AxisSummary`, `DetailProgress` など
  - `detail_questions/page.tsx`: `DetailQuestion`, `DetailQuestionsResponse` など
  - `deep_questions/page.tsx`: `DeepMessage`, `DeepThread` など
- **影響**: 型の不整合、重複定義、メンテナンス性の低下
- **改善**: `types/` ディレクトリに集約

#### 2.2 `any` 型の使用
- **場所**: `app/dashboard/page.tsx`
  - 79行目: `const AXIS_ICONS: Record<string, any>`
  - 196-197行目: `(props.payload as any).coordinate`
- **影響**: 型安全性の欠如
- **改善**: 適切な型定義

#### 2.3 巨大コンポーネント
- **問題**: `dashboard/page.tsx` が425行
  - レーダーチャートの描画ロジックが複雑
  - データ取得・状態管理・UI描画が混在
- **影響**: 可読性・保守性の低下、テストの困難さ
- **改善**: コンポーネント分割（RadarChart, ConceptCard, ActionCards など）

#### 2.4 認証チェックの重複
- **問題**: 各ページで同じパターンの認証チェックが繰り返されている
  ```typescript
  if (status === 401) {
    clearAccessToken();
    router.replace("/login");
    return;
  }
  ```
- **場所**: `dashboard/page.tsx`, `detail_questions/page.tsx`, `deep_questions/page.tsx` など
- **改善**: カスタムフック `useAuth` または `useApiCall` で統一

#### 2.5 エラーハンドリングの重複
- **問題**: 各ページで同じエラーメッセージ設定が繰り返されている
- **改善**: 共通のエラーハンドリング関数またはフック

### 🟡 中優先度

#### 2.6 コンポーネント配置の問題
- **問題**: `app/simple_simulation/components/` にコンポーネントが配置されている
- **影響**: 他のページから再利用しにくい
- **改善**: `components/` 配下に移動、または `components/simulation/` に配置

#### 2.7 インラインスタイルの重複
- **問題**: ボタンスタイルが複数箇所でインライン定義
  - `app/page.tsx`: `baseButton`, `primaryButton`, `secondaryButton`
  - `app/dashboard/page.tsx`: レーダーチャートのカスタム描画
- **改善**: `Button` コンポーネントの拡張、またはスタイル定数の集約

#### 2.8 マジックナンバー・文字列
- **問題**: ハードコードされた値が散在
  - `AXIS_ORDER`, `AXIS_LABELS` が `dashboard/page.tsx` と `detail_questions/page.tsx` で重複
  - エラーメッセージが各ページで個別定義
- **改善**: 定数ファイルに集約

#### 2.9 型の厳密性不足
- **問題**: 
  - `apiFetch` の戻り値が `{ data: T | null; status: number }` で、エラー時の型が不明確
  - `Record<string, unknown>` のような緩い型定義（`AxisDetailClient.tsx`）
- **改善**: より厳密な型定義

### 🟢 低優先度

#### 2.10 テストファイルの不足
- **現状**: `dashboard/__tests__/` に1つだけ、`lib/__tests__/` に2つ
- **改善**: 主要コンポーネント・フックのテスト追加

#### 2.11 コメントの不足
- **問題**: 複雑なロジック（レーダーチャートの描画など）にコメントが少ない
- **改善**: JSDoc コメントの追加

---

## 3. リファクタの優先順位付きToDoリスト

### Phase 1: 基盤整備（影響範囲が小さい、早期着手）

1. ✅ **型定義の集約**
   - `types/api/` ディレクトリ作成
   - 各APIエンドポイントのレスポンス型を定義
   - `types/dashboard.ts`, `types/questions.ts`, `types/auth.ts` など
   - **優先度**: 🔴 高
   - **工数**: 2-3時間

2. ✅ **定数の集約**
   - `constants/` ディレクトリ作成
   - `AXIS_ORDER`, `AXIS_LABELS`, `AXIS_ICONS` を `constants/axes.ts` に移動
   - エラーメッセージを `constants/messages.ts` に集約
   - **優先度**: 🟡 中
   - **工数**: 1-2時間

3. ✅ **`any` 型の排除**
   - `AXIS_ICONS` の型を `Record<string, LucideIcon>` に修正
   - レーダーチャートの `props.payload` に適切な型を定義
   - **優先度**: 🔴 高
   - **工数**: 1時間

4. ✅ **カスタムフック: `useApiCall` の作成**
   - `hooks/useApiCall.ts` を作成
   - 認証チェック・エラーハンドリングを統一
   - ローディング・エラー状態を管理
   - **優先度**: 🔴 高
   - **工数**: 2-3時間

5. ✅ **カスタムフック: `useAuth` の作成**
   - `hooks/useAuth.ts` を作成
   - 認証状態の管理、リダイレクト処理を統一
   - **優先度**: 🟡 中
   - **工数**: 1-2時間

### Phase 2: コンポーネント分割（中規模リファクタ）

6. ✅ **Dashboard コンポーネントの分割**
   - `components/dashboard/ConceptCard.tsx` 作成
   - `components/dashboard/RadarChart.tsx` 作成（レーダーチャート部分を分離）
   - `components/dashboard/ActionCards.tsx` 作成（深掘り・チャット・レポートカード）
   - `components/dashboard/RadarAngleTick.tsx` 作成（カスタムティック描画）
   - **優先度**: 🔴 高
   - **工数**: 3-4時間

7. ✅ **コンポーネントの再配置**
   - `app/simple_simulation/components/` → `components/simulation/` に移動
   - `ChoiceCard.tsx`, `ProgressBar.tsx` を移動
   - **優先度**: 🟡 中
   - **工数**: 30分

8. ✅ **共通ローディング・エラーコンポーネント**
   - `components/ui/LoadingSpinner.tsx` 作成
   - `components/ui/ErrorMessage.tsx` 作成
   - 各ページの重複を削減
   - **優先度**: 🟡 中
   - **工数**: 1時間

### Phase 3: リファクタリング適用（既存コードの改善）

9. ✅ **各ページでの `useApiCall` 適用**
   - `dashboard/page.tsx` をリファクタ
   - `detail_questions/page.tsx` をリファクタ
   - `deep_questions/page.tsx` をリファクタ
   - `summaries/page.tsx` をリファクタ
   - **優先度**: 🔴 高
   - **工数**: 2-3時間

10. ✅ **型定義の適用**
    - 各ページで新しく定義した型を使用
    - `apiFetch` の呼び出しを型安全に
    - **優先度**: 🔴 高
    - **工数**: 1-2時間

11. ✅ **定数の適用**
    - 各ページでハードコードされた値を定数に置き換え
    - **優先度**: 🟡 中
    - **工数**: 1時間

### Phase 4: 細かい改善（低優先度）

12. ✅ **Button コンポーネントの拡張**
    - `variant` の追加（必要に応じて）
    - インラインスタイルの削減
    - **優先度**: 🟢 低
    - **工数**: 30分

13. ✅ **エラーメッセージの統一**
    - すべてのエラーメッセージを `constants/messages.ts` から取得
    - **優先度**: 🟡 中
    - **工数**: 1時間

14. ✅ **JSDoc コメントの追加**
    - 複雑な関数・コンポーネントにコメント追加
    - **優先度**: 🟢 低
    - **工数**: 1-2時間

15. ✅ **テストの追加**
    - 新しく作成したフック・コンポーネントのテスト
    - **優先度**: 🟢 低
    - **工数**: 2-3時間

### Phase 5: ディレクトリ構成の最終調整

16. ✅ **ディレクトリ構造の整理**
    - `types/` ディレクトリの最終確認
    - `hooks/` ディレクトリの整理
    - `components/` のサブディレクトリ整理
    - **優先度**: 🟡 中
    - **工数**: 30分

17. ✅ **インポートパスの整理**
    - 相対パスを絶対パス（`@/`）に統一
    - **優先度**: 🟡 中
    - **工数**: 30分

18. ✅ **未使用コードの削除**
    - 未使用のインポート・変数を削除
    - **優先度**: 🟢 低
    - **工数**: 30分

### Phase 6: ドキュメント・最終確認

19. ✅ **README の更新**
    - ディレクトリ構成の説明を追加
    - **優先度**: 🟢 低
    - **工数**: 30分

20. ✅ **型チェック・Lint の確認**
    - `tsc --noEmit` で型エラーがないか確認
    - ESLint の警告を解消
    - **優先度**: 🟡 中
    - **工数**: 1時間

---

## 4. 「まず着手すべき3項目」とその具体的な進め方

### 🎯 第1優先: 型定義の集約

**理由**: 
- 他のリファクタの基盤となる
- 影響範囲が明確で、既存コードを壊さない
- 型安全性が向上し、以降の開発が楽になる

**進め方**:

1. **ディレクトリ作成**
   ```bash
   mkdir -p types/api
   ```

2. **型定義ファイルの作成**
   - `types/api/dashboard.ts`: `DashboardData`, `AxisSummary`, `DetailProgress`, `NextFocus`
   - `types/api/questions.ts`: `DetailQuestion`, `DetailQuestionsResponse`
   - `types/api/deep-questions.ts`: `DeepMessage`, `DeepThread`, `AxisOption`
   - `types/api/simulation.ts`: `SimulationResult`
   - `types/api/auth.ts`: `AuthUrlResponse`, `AuthTokensResponse`
   - `types/api/axes.ts`: `AxisDetail`, `AxisListResponse`
   - `types/api/summaries.ts`: `SummaryResponse`

3. **バックエンドのスキーマを参考に型定義**
   - `C:\ksuns_back\app\schemas\` の内容を参考にする
   - フロントエンドで必要な型のみを定義

4. **各ページでの適用**
   - 既存の型定義を削除
   - `types/api/*` からインポートに変更
   - 型エラーがないか確認

**注意点**:
- APIインターフェースは変更しない（バックエンドとの互換性を保つ）
- 既存の型定義と完全に一致させる

---

### 🎯 第2優先: カスタムフック `useApiCall` の作成

**理由**:
- 認証チェック・エラーハンドリングの重複を一気に解消
- 複数ページで即座に効果が出る
- テストしやすい構造になる

**進め方**:

1. **`hooks/useApiCall.ts` の作成**
   ```typescript
   // hooks/useApiCall.ts の骨組み
   export function useApiCall<T>(
     apiPath: string,
     options?: { method?: HttpMethod; body?: unknown; autoRedirect?: boolean }
   ) {
     const [data, setData] = useState<T | null>(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     const router = useRouter();
     
     useEffect(() => {
       // apiFetch 呼び出し
       // 401 エラー時の処理
       // エラーハンドリング
     }, [apiPath, ...]);
     
     return { data, loading, error };
   }
   ```

2. **`dashboard/page.tsx` で試用**
   - 既存の `useEffect` を `useApiCall` に置き換え
   - 動作確認

3. **他のページに適用**
   - `detail_questions/page.tsx`
   - `deep_questions/page.tsx`
   - `summaries/page.tsx`

4. **エラーメッセージの外部化**
   - `constants/messages.ts` を作成
   - エラーメッセージを定数化

**注意点**:
- 既存の動作を変えない（リダイレクトタイミングなど）
- 段階的に適用（一度に全部変更しない）

---

### 🎯 第3優先: Dashboard コンポーネントの分割

**理由**:
- 425行の巨大コンポーネントを分割することで可読性が大幅に向上
- テストが書きやすくなる
- 他のページでも再利用可能なコンポーネントが生まれる

**進め方**:

1. **コンポーネント分割の計画**
   - `ConceptCard`: コンセプト表示カード（293-302行目）
   - `RadarChartSection`: レーダーチャート全体（305-353行目）
   - `RadarAngleTick`: カスタムティック描画（171-243行目）
   - `ActionCards`: 深掘り・チャット・レポートカード（357-419行目）

2. **`components/dashboard/` ディレクトリ作成**
   ```bash
   mkdir -p components/dashboard
   ```

3. **各コンポーネントの作成**
   - まず `ConceptCard` から作成（シンプルで影響が小さい）
   - 次に `ActionCards`（比較的独立）
   - 最後に `RadarChartSection`（複雑だが影響範囲が明確）

4. **`dashboard/page.tsx` での統合**
   - 分割したコンポーネントをインポート
   - 既存のJSXを置き換え
   - 動作確認

5. **型定義の適用**
   - 各コンポーネントに適切な型を付与
   - Props の型を明確に

**注意点**:
- レーダーチャートの `renderAngleTick` は複雑なので、慎重に移動
- 既存の `id` 属性（テスト用）は維持
- スタイルは変更しない

---

## 5. リファクタリング時の注意事項

### ✅ 守るべき原則

1. **APIインターフェースは変更しない**
   - リクエスト/レスポンスの構造は維持
   - バックエンドとの互換性を保つ

2. **画面の挙動は変えない**
   - リダイレクトタイミング
   - エラーメッセージの表示タイミング
   - ローディング状態の表示

3. **段階的に進める**
   - 一度に大量の変更をしない
   - 1つの変更ごとに動作確認

4. **テストIDの維持**
   - 既存の `id` 属性は維持（E2Eテストで使用されている可能性）

### 🔍 確認方法

- 各ページを手動で動作確認
- 型チェック: `npm run build` または `tsc --noEmit`
- Lint: `npm run lint`

---

## 6. 期待される効果

### 短期的効果（Phase 1-2完了時）
- 型安全性の向上（`any` の排除）
- コードの重複削減（認証チェック、エラーハンドリング）
- 可読性の向上（Dashboard の分割）

### 長期的効果（全Phase完了時）
- メンテナンス性の向上
- 新機能追加の容易さ
- テストの書きやすさ
- チーム開発の効率化

---

## 7. 補足: ディレクトリ構成の理想形（完了後）

```
ksuns_front/
├── app/                          # ページのみ（薄い）
│   ├── page.tsx
│   ├── dashboard/
│   │   └── page.tsx              # コンポーネント呼び出しのみ
│   └── ...
├── components/
│   ├── ui/                       # 汎用UI
│   ├── dashboard/                # Dashboard専用
│   │   ├── ConceptCard.tsx
│   │   ├── RadarChartSection.tsx
│   │   └── ActionCards.tsx
│   └── simulation/               # シミュレーション専用
│       ├── ChoiceCard.tsx
│       └── ProgressBar.tsx
├── hooks/
│   ├── useApiCall.ts
│   └── useAuth.ts
├── types/
│   └── api/
│       ├── dashboard.ts
│       ├── questions.ts
│       └── ...
├── constants/
│   ├── axes.ts
│   └── messages.ts
└── lib/
    ├── api-client.ts
    ├── auth-token.ts
    └── storage.ts
```

---

**作成日**: 2024年
**対象リポジトリ**: `C:\ksuns_front`
**前提**: Next.js 16 (App Router), TypeScript, Tailwind CSS

