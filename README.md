# skill-architecture app

スキルフォルダの中身を**インタラクティブなアーキテクチャ図**として保存・閲覧する Web アプリです。元リポジトリの `template.html` と `SKILL.md` の思想を、Next.js + Convex + WorkOS AuthKit + Vercel で運用できる形にしました。

## 構成

| 領域 | 技術 |
|------|------|
| Web | Next.js / React Flow |
| DB | Convex |
| 認証 | WorkOS AuthKit（Google ログインは WorkOS 側で有効化） |
| 管理画面 | `/admin` |
| AI 生成 | Anthropic API（`ANTHROPIC_MODEL` で差し替え） |
| デプロイ | Vercel |

## ローカル起動

```bash
npm install
npx convex dev --once
npm run dev
```

WorkOS の環境変数が未設定の場合は、ローカル確認用の demo admin で起動します。

## 環境変数

`.env.example` を参考に設定します。

```bash
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=
APP_INTERNAL_SECRET=

WORKOS_API_KEY=
WORKOS_CLIENT_ID=
WORKOS_COOKIE_PASSWORD=
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
ADMIN_EMAILS=

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

本番では WorkOS Dashboard で Google ログインを有効化し、Redirect URI に `https://<your-domain>/callback` を登録します。

## Vercel

Convex の Production Deploy Key を Vercel の `CONVEX_DEPLOY_KEY` に入れて、Build Command は次を使います。

```bash
npm run convex:deploy
```

Vercel CLI で入れる場合:

```bash
npx vercel env add CONVEX_DEPLOY_KEY production
npx vercel env add APP_INTERNAL_SECRET production
npx vercel env add WORKOS_API_KEY production
npx vercel env add WORKOS_CLIENT_ID production
npx vercel env add WORKOS_COOKIE_PASSWORD production
npx vercel env add NEXT_PUBLIC_WORKOS_REDIRECT_URI production
npx vercel env add ADMIN_EMAILS production
npx vercel env add ANTHROPIC_API_KEY production
npx vercel env add ANTHROPIC_MODEL production
```

---

## 元の skill-architecture 仕様

スキルフォルダの中身を**インタラクティブなアーキテクチャ図（HTML）**に変換するスキル。

---

## 何をするツールか

`.claude/skills/` などのフォルダを指定すると、その中のサブフォルダを1つずつ分析して、ノードグラフ形式の可視化HTMLを生成する。「どのファイルがどのファイルを呼んでいるか」を図で見られるようになる。

---

## トリガーワード

次のいずれかを言うと自動起動する：

- 「スキルを可視化して」
- 「アーキテクチャ図を作って」
- 「フォルダを比較したい」
- 「architectureを作って」
- 「skill-architecture」
- 「フローを図にして」

---

## 使い方

```
.claude/skills/ を可視化して
```

フォルダパスを指定するだけでOK。あとは自動で動く。

---

## 出力

| 項目 | 内容 |
|------|------|
| ファイル形式 | `.html`（ブラウザで開くだけで動く） |
| 出力先 | `output/html/skill-architecture_{ver}.html` |
| バージョン管理 | 既存の最新版を元に番号+1で新規生成 |

---

## HTMLの主な機能

| 機能 | 説明 |
|------|------|
| タブ切り替え | スキルごとにタブで切り替え表示 |
| ノードドラッグ | 各ノードを自由に動かせる（位置は自動保存） |
| ⚡ 自動整列 | ボタン1つで左→右のきれいな配置に整列 |
| フローハイライト | フローを選ぶと関連ノード・接続線が光る |
| ノード詳細 | ノードをクリックすると右パネルに詳細表示 |
| 付箋メモ | キャンバス上に自由にメモを貼れる |
| ズーム | ＋/－またはホイールで拡大縮小 |
| キャンバスパン | 空白をドラッグして画面移動 |

---

## ノードの種類と色

| 色 | 種類 | 例 |
|----|------|----|
| 灰青 | external | ユーザー入力・外部ファイル |
| 琥珀 | entry | SKILL.md・起動点 |
| 青 | detail | サブワークフロー文書・設定スキーマ |
| 緑 | tool | スクリプト・CLIツール |
| 紫 | parallel | 並列実行ロール・サブエージェント |
| オレンジ | config | JSON設定ファイル |
| エメラルド | output | 最終成果物（.pptx / .html など） |

---

## template.html の使い方

`template.html` はアーキテクチャ図のベースファイル。以下の手順で自分のスキルに合わせて使う。

### 手順

1. `template.html` を任意の場所にコピーする
2. ファイル内の `const SKILLS_DATA = {` を探す
3. `example` ブロックの中身を自分のスキルのノード・接続・フローに書き換える
4. ブラウザで開いて確認する（⚡ 自動整列ボタンで見やすく整列できる）

### SKILLS_DATA の最小構成

```javascript
const SKILLS_DATA = {
  my_skill: {                          // スキルIDはスネークケースで
    name: "My Skill",                  // タブ・ヘッダーに表示される名前
    icon: "🔧",                        // タブに表示される絵文字
    path: ".claude/skills/my-skill/",  // ヘッダーのサブテキスト
    nodes: [
      {
        id: "ms_user",        // スキル内で一意のID（スキルIDの略称を prefix に）
        label: "ユーザー",
        x: 40, y: 180,        // 大まかな位置。⚡自動整列で後から整えられる
        w: 110, h: 44,
        cat: "external",      // ノードの種類（下の表を参照）
        role: "一行の役割説明",
        desc: "クリック時に右パネルに表示される詳細説明",
        meta: { key: "value" }
      }
    ],
    connections: [
      { from: "ms_user", to: "ms_skill", type: "normal" }
      // type: "normal"（実線）/ "dashed"（破線）/ "par"（紫の実線）
    ],
    flows: [
      {
        id: "flow_main",
        name: "メインフロー",
        desc: "フローの説明",
        nodes: ["ms_user", "ms_skill"],   // ハイライトするノードID
        conns: ["ms_user→ms_skill"],      // ハイライトする接続（→ で繋ぐ）
        steps: [
          { n: 1, text: "ステップ名", detail: "詳細説明", exec: "claude" }
          // exec: "claude"（Claude実行）/ "sub"（サブエージェント実行）
        ]
      }
    ]
  }
};
```

### ノードの種類（cat）

| cat | 色 | 使いどころ |
|-----|----|-----------|
| `external` | 灰青 | ユーザー入力・外部ファイル |
| `entry` | 琥珀 | SKILL.md・起動点 |
| `detail` | 青 | サブワークフロー文書・設定スキーマ |
| `tool` | 緑 | スクリプト・CLIツール |
| `parallel` | 紫 | 並列実行ロール・サブエージェント |
| `config` | オレンジ | JSON設定ファイル |
| `output` | エメラルド | 最終成果物（.pptx / .html など） |

---

## ファイル構成

```
.claude/skills/skill-architecture/
├── SKILL.md       # スキルの実装仕様（Claudeが参照する）
├── README.md      # このファイル（人間向け説明）
└── template.html  # アーキテクチャ図のベースHTML
```
