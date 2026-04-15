# WordShare — Phase 3 Setup Guide
# フェーズ3 セットアップガイド

## 🚀 Quick Start with Claude Code

### Step 1: Supabase プロジェクト作成
1. https://supabase.com にアクセスしてアカウント作成（無料）
2. 「New Project」でプロジェクト作成（名前: wordshare）
3. Project Settings → API から以下をコピー:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY

### Step 2: データベース初期化
Supabase Dashboard → SQL Editor を開き、
`supabase/migrations/001_initial_schema.sql` の内容をすべて貼り付けて実行。

### Step 3: Supabase Auth 設定
1. Authentication → Providers → Email を有効化（Magic Link推奨）
2. （任意）Google OAuth も有効にする場合:
   - Google Cloud Console で OAuth Client ID を取得
   - Supabase の Google Provider に設定

### Step 4: Anthropic API Key 取得
1. https://console.anthropic.com でキーを作成
2. `.env.local` に設定

### Step 5: Claude Code で開発開始

```bash
# プロジェクトフォルダに移動
cd wordshare

# Claude Code を起動
claude

# 最初のプロンプト:
> CLAUDE.md を読んで、プロジェクトの全体像を把握してください。
> 次に、Next.js プロジェクトをセットアップして、
> package.json の依存関係をインストールし、
> Tailwind CSS と Supabase クライアントを設定してください。
```

### Step 6: 推奨する開発順序

Claude Code に以下の順番でタスクを依頼：

1. **プロジェクト初期化**
   > Next.js App Router プロジェクトをセットアップして。CLAUDE.md の構成に従って。

2. **認証フロー**
   > Supabase Auth でログイン画面を実装して。Magic Link方式で。

3. **タイムライン + 投稿**
   > タイムライン画面と単語投稿フォームを実装して。Supabase Realtime で自動更新されるように。

4. **リアクション + コメント**
   > WordCard にリアクション・コメント機能を追加して。

5. **クイズ（分散学習）**
   > SM-2アルゴリズムのクイズ画面を実装して。src/lib/srs.ts のロジックを使って。

6. **統計ダッシュボード**
   > 学習統計画面を実装して。SRS進捗バー含めて。

7. **AI機能**
   > API ルート /api/ai/example と /api/ai/hint を実装して。

8. **テスト + デプロイ**
   > SRS のユニットテストを実行して、Vercel にデプロイして。

### Step 7: Vercel デプロイ

```bash
# Vercel CLI でデプロイ
npx vercel

# 環境変数を Vercel に設定
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
npx vercel env add ANTHROPIC_API_KEY
```

---

## 📁 プロジェクト構成

```
wordshare/
├── CLAUDE.md                    ← Claude Code への全指示
├── README.md                    ← このファイル
├── .env.local.example           ← 環境変数テンプレート
├── package.json                 ← 依存関係
├── tailwind.config.ts           ← カラーパレット定義
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  ← DB スキーマ（RLS含む）
└── src/
    └── lib/
        ├── types.ts             ← TypeScript 型定義
        ├── srs.ts               ← SM-2 アルゴリズム
        ├── ai.ts                ← Claude API ヘルパー
        ├── utils.ts             ← ユーティリティ関数
        └── __tests__/
            └── srs.test.ts      ← SRS ユニットテスト
```

## ✅ Artifact版からの改善点

| 課題 | Artifact版 | Phase 3 |
|------|-----------|---------|
| リアルタイム同期 | ❌ 手動更新 | ✅ Supabase Realtime |
| 認証 | ⚠️ 名前のみ | ✅ Magic Link / OAuth |
| 同時編集 | ⚠️ Last-write-wins | ✅ DB トランザクション |
| ストレージ制限 | ⚠️ 5MB/key | ✅ 無制限（PostgreSQL） |
| URL共有 | ❌ 不可 | ✅ 独自ドメイン |
| PWA対応 | ❌ | ✅ ホーム画面追加可能 |
| APIキー安全性 | ⚠️ クライアント露出 | ✅ サーバーサイド |
