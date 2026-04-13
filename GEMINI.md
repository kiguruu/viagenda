# GEMINI.md (Project Specification & Roadmap)

## プロジェクト概要
旅行の日程を直感的に管理・作成できる、Googleカレンダー風のWebアプリケーション。
まずはフロントエンド完結（ローカル保存）でプロトタイプを構築し、UI/UXの完成度を高めることを目標とする。

### 仮プロジェクト名
`Viagenda`(Viagem + Agenda, ポルトガル語で「旅」と「予定」を意味する)

## 技術スタック
慣れ親しんだTypeScriptとReactのエコシステムを最大限活用する。

* **フレームワーク:** Next.js (App Router推奨)
* **言語:** TypeScript
* **UIライブラリ (カレンダー):** `@fullcalendar/react` (DayGrid, TimeGrid, Interactionプラグインを使用、v6を指定)
* **スタイリング/UIコンポーネント:** Tailwind CSS + shadcn/ui (または MUI)
* **データ永続化:** `localStorage` (カスタムフック化して状態管理と同期)
* **日付操作:** `dayjs` または `date-fns`

## コア機能要件
1. **カレンダービュー:**
   - 月・週・日など複数のビュー切り替え。
   - 旅行期間にフォーカスしやすいUI。
2. **予定のCRUD操作:**
   - カレンダーの空き枠クリックで「作成」モーダル表示。
   - 既存タイルクリックで「編集/削除」モーダル表示。
3. **直感的な操作 (Drag & Drop):**
   - タイルのドラッグ＆ドロップによる日時移動。
   - タイルの端をドラッグすることによる時間（長さ）の変更。
4. **インポート / エクスポート:**
   - アプリ内データ（JSON形式）の入出力機能。
   - (オプション) `.ics` 形式でのエクスポート（外部カレンダー連携用）。

## データ構造 (localStorage)
以下のようなJSON配列を `localStorage` の `travel-events` キーなどに保存する。

```json
[
  {
    "id": "event-001",
    "title": "札幌駅到着",
    "start": "2026-05-01T10:00:00",
    "end": "2026-05-01T10:30:00",
    "description": "快速エアポートで到着",
    "location": "札幌駅"
  },
  {
    "id": "event-002",
    "title": "余市蒸溜所見学",
    "start": "2026-05-02T13:00:00",
    "end": "2026-05-02T15:00:00",
    "description": "試飲あり。事前に予約チケットの確認。",
    "location": "ニッカウヰスキー 北海道工場 余市蒸溜所"
  }
]
```

## 開発ロードマップ（小さなステップで進める）
### Step 1: 基礎環境構築とカレンダー表示
- [x] Next.jsプロジェクトのセットアップ (ユーザーが行うので、内容と開発サーバーが動作するかのみ確認してください。)
- [x] FullCalendarのインストールと静的カレンダーの表示。
- [x] 仮のハードコードされたデータ（上記JSONのようなもの）をカレンダー上に表示させる。

### Step 2: 状態管理と localStorage 連携
- [x] イベントデータをReactの useState で管理する。
- [x] useEffect を使い、状態が変化するたびに localStorage に保存するカスタムフック (useLocalStorage) を作成。
- [x] 初回レンダリング時に localStorage からデータを読み込む処理を実装。
※Chromeなどのブラウザで、リロードしても予定が消えないことを確認する。

### Step 3: ドラッグ＆ドロップ機能の有効化
- [x] FullCalendarの editable={true} などのプロパティを設定。
- [x] eventDrop (移動時) と eventResize (時間変更時) のコールバック関数を実装し、状態（およびlocalStorage）を更新する。

### Step 4: CRUD UIの実装 (フォーム作成)
- [x] カレンダーのクリックイベント（dateClick）を取得。
- [x] 予定のタイトルや詳細を入力するモーダル（ダイアログ）UIを作成。
- [x] 新規追加、更新、削除のロジックを実装。

### Step 5: エクスポート・インポート機能
- [x] 現在のイベント状態をJSON文字列に変換し、Blobを使って .json ファイルとしてダウンロードさせる「エクスポート」ボタンの実装。
- [x] ファイルリーダーを使って .json を読み込み、状態を上書きする「インポート」ボタンの実装。

## 実施済み作業 (2026-04-13)
- **環境構築**: `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`, `dayjs` の導入。
- **状態管理**: `hooks/useLocalStorage.ts` を作成し、`localStorage` との同期を実装。
- **UIコンポーネント**: `shadcn/ui` (Tailwind v4 対応) を導入。`Dialog`, `Form`, `Input`, `Textarea`, `Button` 等を使用。
- **機能実装**: カレンダー上でのドラッグ＆ドロップ、リサイズ、クリックによる予定の作成・編集・削除機能を完備。
- **データ連携**: JSON形式でのインポート/エクスポートボタンをヘッダーに実装。
- **ビルド確認**: TypeScriptの型エラー（FullCalendar v6固有の型インポート）を修正し、`next build` が通ることを確認。
