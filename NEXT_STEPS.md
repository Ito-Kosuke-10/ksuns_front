# 次の開発ステップ

## 概要

このドキュメントでは、チーム開発に移行する際の次のステップを整理しています。

---

## 🎯 優先順位付きTODOリスト

### Phase 1: データベース設計と実装（最優先）

#### 1.1 複数プラン対応のデータベース設計

**現状の問題**:
- 1アカウントで1つのプランしか作れない
- プランA、プランB、プランCのように複数プランを作れるようにしたい

**必要な作業**:
1. **データベーススキーマの設計**
   - `plans` テーブルの追加
   - `users` テーブルとのリレーション（1対多）
   - 既存のテーブル（`simple_simulation_sessions`, `axis_scores` など）に `plan_id` を追加

2. **マイグレーションスクリプトの作成**
   - 既存データの移行（既存ユーザーのデータを `plan_id=1` のデフォルトプランに紐付け）

3. **APIの修正**
   - すべてのエンドポイントで `plan_id` を考慮
   - プラン選択・作成・削除のエンドポイント追加

**推定工数**: 2-3日

---

#### 1.2 質問データテーブルの実装

**必要な作業**:
1. **`questions` テーブルの作成**
   - 簡易シミュレーションの質問データをDBに格納
   - 質問文、選択肢、タイプ（single/multi/slider）などを保存

2. **質問データの管理画面（オプション）**
   - 質問の追加・編集・削除ができる管理画面

**推定工数**: 1-2日

---

#### 1.3 シミュレーション結果のデータテーブル拡張

**必要な作業**:
1. **既存テーブルの確認と拡張**
   - `simple_simulation_results` テーブルの確認
   - 必要に応じてカラム追加

2. **レーダーチャート項目のデータテーブル**
   - 各項目（コンセプト、収支予測、資金計画など）の詳細データを格納
   - 項目ごとの完了状態を管理

**推定工数**: 1-2日

---

### Phase 2: レーダーチャートの項目変更

**変更内容**:
- コンプライアンス → 収支予測
- レーダーチャートの下3つ: コンセプト、収支予測、資金計画
- レーダーチャートの上3つ: 内装・外装、立地、オペレーション
- 左: 集客 → 販促
- 右: コンプライアンス → メニュー

**必要な作業**:
1. **バックエンド**
   - `app/models/axis.py` の `PlanningAxis` モデルを更新
   - データベースマイグレーション（既存データの移行）
   - `app/services/detail_questions.py` の軸コードを更新

2. **フロントエンド**
   - `app/dashboard/page.tsx` の `AXIS_LABELS`, `AXIS_ORDER` を更新
   - `app/detail_questions/page.tsx` の `AXIS_ORDER` を更新

**推定工数**: 1日

---

### Phase 3: 収支計画・資金計画の実装

#### 3.1 想定PL（月次）の実装

**必要な機能**:
- 売上計算: 席数、回転率、客単価、営業時間、テイクアウト比率
- 費用計算: FL比率（Food + Labor）、家賃比率
- 初期投資回収期間の計算

**必要な作業**:
1. **データベース設計**
   - `monthly_pl` テーブルの作成
   - 各項目（売上、費用、利益）を格納

2. **バックエンドAPI**
   - PL計算ロジックの実装
   - `/pl/monthly` エンドポイントの作成

3. **フロントエンド**
   - PL表示画面の作成
   - 表形式での表示
   - 入力フォーム（回転率、FL比率、家賃比率など）

**推定工数**: 3-5日

---

#### 3.2 資金計画の実装

**必要な機能**:
- 初期投資の入力: 内装、厨房、保証金、備品、開業前広告、システム
- AIによる概算値の生成（オプション）
- 運転資金（3〜6ヶ月分）の計算
- 必要資金の計算
- 自己資金と借入金の管理

**必要な作業**:
1. **データベース設計**
   - `funding_plan` テーブルの作成
   - 各項目（内装、厨房、保証金など）を格納

2. **バックエンドAPI**
   - 資金計画計算ロジックの実装
   - `/funding/plan` エンドポイントの作成

3. **フロントエンド**
   - 資金計画入力画面の作成
   - 表形式での表示
   - AI概算値生成ボタン（オプション）

**推定工数**: 3-5日

---

### Phase 4: AIチャットボット機能の拡張

#### 4.1 深掘り質問の完了機能

**必要な機能**:
- 各項目（コンセプト、収支予測、資金計画など）でAIチャットボットと相談
- 考えがまとまったら「完了」ボタンを押してデータベースに格納

**必要な作業**:
1. **データベース設計**
   - `axis_completions` テーブルの作成
   - 完了状態、完了日時、完了内容を格納

2. **バックエンドAPI**
   - `/axes/{axis_code}/complete` エンドポイントの作成
   - 完了状態の更新

3. **フロントエンド**
   - 深掘り質問ページに「完了」ボタンを追加
   - 完了状態の表示

**推定工数**: 2-3日

---

#### 4.2 なんでも質問ページの実装

**必要な作業**:
1. **バックエンドAPI**
   - `/qa/messages` エンドポイントは既に実装済み
   - 確認と必要に応じて拡張

2. **フロントエンド**
   - `app/chat/page.tsx` の実装
   - チャットUIの作成
   - メッセージ履歴の表示

**推定工数**: 2-3日

---

### Phase 5: 開業プラン出力機能

**必要な機能**:
- これまで入力して保存してきたものを一覧で表示
- PDF/Excelで出力

**必要な作業**:
1. **バックエンドAPI**
   - `/report/generate` エンドポイントの作成
   - PDF/Excel生成ライブラリの選定と実装

2. **フロントエンド**
   - `app/report/page.tsx` の実装
   - 一覧表示
   - 出力ボタン

**推定工数**: 3-5日

---

## 📊 データベース設計の方向性

### 複数プラン対応

```sql
-- plans テーブル
CREATE TABLE plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,  -- "プランA", "プランB" など
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 既存テーブルに plan_id を追加
ALTER TABLE simple_simulation_sessions ADD COLUMN plan_id INT;
ALTER TABLE axis_scores ADD COLUMN plan_id INT;
-- その他、プランに関連するテーブルにも plan_id を追加
```

### レーダーチャート項目の詳細データ

```sql
-- axis_details テーブル（各項目の詳細データ）
CREATE TABLE axis_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_id INT NOT NULL,
    axis_code VARCHAR(50) NOT NULL,
    completion_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    completion_data JSON,  -- 完了時のデータ（JSON形式）
    completed_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);
```

### 収支計画・資金計画

```sql
-- monthly_pl テーブル
CREATE TABLE monthly_pl (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_id INT NOT NULL,
    month INT NOT NULL,  -- 1-12
    revenue DECIMAL(10, 2),
    food_cost DECIMAL(10, 2),
    labor_cost DECIMAL(10, 2),
    rent_cost DECIMAL(10, 2),
    other_costs DECIMAL(10, 2),
    profit DECIMAL(10, 2),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- funding_plan テーブル
CREATE TABLE funding_plan (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_id INT NOT NULL,
    interior_cost DECIMAL(10, 2),
    kitchen_cost DECIMAL(10, 2),
    deposit DECIMAL(10, 2),
    equipment_cost DECIMAL(10, 2),
    pre_opening_marketing DECIMAL(10, 2),
    system_cost DECIMAL(10, 2),
    working_capital_months INT DEFAULT 3,
    working_capital_amount DECIMAL(10, 2),
    total_required_funding DECIMAL(10, 2),
    own_capital DECIMAL(10, 2),
    loan_amount DECIMAL(10, 2),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);
```

---

## 🔄 API設計の方向性

### プラン管理

```
GET    /plans                    # プラン一覧取得
POST   /plans                    # プラン作成
GET    /plans/{plan_id}          # プラン詳細取得
PUT    /plans/{plan_id}          # プラン更新
DELETE /plans/{plan_id}          # プラン削除
```

### 収支計画

```
GET    /plans/{plan_id}/pl/monthly    # 月次PL取得
POST   /plans/{plan_id}/pl/monthly    # 月次PL作成・更新
GET    /plans/{plan_id}/pl/summary    # PLサマリー取得
```

### 資金計画

```
GET    /plans/{plan_id}/funding       # 資金計画取得
POST   /plans/{plan_id}/funding       # 資金計画作成・更新
POST   /plans/{plan_id}/funding/estimate  # AI概算値生成
```

### 項目完了

```
POST   /plans/{plan_id}/axes/{axis_code}/complete  # 項目完了
GET    /plans/{plan_id}/axes/{axis_code}/status    # 項目状態取得
```

---

## 📝 開発時の注意事項

1. **既存機能の維持**
   - 既存のAPIインターフェースは変更しない
   - 既存の画面の挙動は変えない

2. **段階的な実装**
   - 一度に大量の変更をしない
   - 1つの機能を完了してから次に進む

3. **テスト**
   - 各機能の動作確認を必ず実施
   - 既存機能への影響を確認

4. **ドキュメント**
   - API仕様書の更新
   - データベーススキーマの更新

---

## 🎯 最初に着手すべきこと

1. **複数プラン対応のデータベース設計**（最優先）
   - これが他の機能の基盤となる
   - データベース設計が決まれば、API設計も明確になる

2. **レーダーチャートの項目変更**（比較的簡単）
   - データベース設計と並行して進められる
   - 影響範囲が明確

3. **収支計画・資金計画の実装**（機能開発）
   - データベース設計が完了してから着手

---

## 📚 参考資料

- `REFACTORING_PLAN.md` - リファクタリング計画（後回し）
- `ENV_SETUP.md` - 環境変数設定手順
- バックエンドの `app/models/` - 既存のデータモデル
- バックエンドの `app/schemas/` - 既存のAPIスキーマ

