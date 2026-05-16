---
name: skill-architecture
description: "指定フォルダ内のサブフォルダを各タブとして、ドラッグ可能なノードグラフ＋フロー解説のインタラクティブHTMLを生成する。トリガー: 'スキルを可視化して', 'アーキテクチャ図を作って', 'フォルダを比較したい', 'architectureを作って', 'skill-architecture', 'フローを図にして'"
---

# Skill Visualizer

指定フォルダ内の **各サブフォルダ = 1タブ** として、インタラクティブなアーキテクチャ可視化 HTML を生成する。サブフォルダが 2 個でも 5 個でも動く。

## 生成されるHTMLの機能（テンプレートに内蔵済み）

| 機能 | 説明 |
|------|------|
| タブ切り替え | スキルごとにタブで切り替え |
| ノードドラッグ | 全ノードを自由にドラッグ移動（位置は localStorage に保存） |
| ⚡ 自動整列 | Kahn法（トポロジカルBFS）で最長パスを算出して左→右に自動配置。processed Set で二重キュー・無限ループを防止。サイクルノードは末尾レイヤーへフォールバック |
| 動的キャンバス | ノードをドラッグしてはみ出してもキャンバスが自動拡張 |
| ラベルドラッグ | 接続線の `label` はドラッグ可能な div として表示（位置も保存） |
| ↺ 位置リセット | ノード位置・ラベル位置を SKILLS_DATA の初期値に戻す |
| フローハイライト | フロー選択でノード・接続線をハイライト表示 |
| ノード詳細 | クリックで右パネルに role / desc / meta を表示 |
| 付箋メモ | 黄・ピンク・青・緑の付箋をキャンバス上に自由配置 |
| スキル名編集 | ヘッダーのスキル名をクリックしてインライン編集（localStorage 保存） |
| ズーム | ＋/－ボタンまたはホイールでズーム（30%〜200%） |
| 右パネルリサイズ | 右パネル幅をドラッグで変更可能 |
| 右パネル開閉 | ◀/▶ ボタンで右パネルをワンクリック開閉（状態は localStorage に保存） |
| テキスト折り返し | ラベルが長いノードは自動折り返し・高さ可変（DOM 描画後に実高さを取得してアロー接続点も正確に計算） |
| キャンバスパン | 空白エリアを左クリックドラッグで画面移動（n8n スタイル）。X・Y 同時更新のため斜め移動も可能 |

---

## 入出力

| 項目 | 内容 |
|------|------|
| **入力** | ユーザー指定のフォルダパス（サブフォルダを持つ任意のディレクトリ） |
| **出力** | `output/html/skill-architecture_{ver}.html`（バージョン番号を+1） |
| **テンプレ** | 最新の `output/html/skill-architecture_*.html` をコピーして `SKILLS_DATA` と `currentSkillId` のみ置換 |

---

## Step 1: フォルダスキャン

```bash
ls {target_folder}/
```

サブフォルダ一覧を取得する。各サブフォルダが 1 スキル = 1 タブになる。

---

## Step 2: 各サブフォルダを分析

各サブフォルダについて **以下の順** でファイルを読む。

### 2-1. エントリーポイントを特定

| 見つかったファイル | スキルの種類 |
|------------------|-------------|
| `SKILL.md` | Claude Code スキル（.claude/skill/ 配下） |
| `AGENTS.md` / `CLAUDE.md` | エージェント型・マルチロール型 |
| `README.md` のみ | サードパーティツール |

### 2-2. 構造把握コマンド

```bash
ls {subfolder}/
ls {subfolder}/agents/    2>/dev/null
ls {subfolder}/skills/    2>/dev/null
ls {subfolder}/scripts/   2>/dev/null
ls {subfolder}/commands/  2>/dev/null
ls {subfolder}/workflows/ 2>/dev/null
```

### 2-3. 読むべきファイル（各最大 80 行）

1. エントリーポイント（SKILL.md / AGENTS.md / README.md）
2. 重要そうなサブドキュメント 1〜2 件（agents/*.md, workflows/ など）
3. scripts/ や tools/ 内は **一覧だけ**取得（内容は読まない）

---

## Step 3: SKILLS_DATA を設計

### ノードカテゴリ

| cat | 色 | 使いどころ |
|-----|----|-----------|
| `"external"` | 灰青 | ユーザー入力・外部ファイル・クラウドパス |
| `"entry"` | 琥珀 | SKILL.md / AGENTS.md / plugin manifest など起動点 |
| `"detail"` | 青 | サブワークフロー文書・カタログ・設定スキーマ |
| `"tool"` | 緑 | スクリプト・ライブラリ・CLI ツール |
| `"parallel"` | 紫 | 並列実行ロール・サブエージェント |
| `"config"` | オレンジ | theme.js / JSON 設定ファイル |
| `"output"` | エメラルド | 最終成果物（.pptx / .pdf / .html など） |

### XY 配置の原則

**⚡ 自動整列ボタンがあるため、x/y は大まかでOK。** ブラウザで開いた後にワンクリックで BFS 解析による自動整列が実行される。

- `x` は左→右の大まかな流れだけ意識する（左端 `40` 〜 右端 `1200` 程度）
- `y` は並列パスを縦に分ける（間隔 100〜130px）
- `w` はラベル長に応じて 120〜200px、`h` は固定 `44`
- ノードは **左→右** に流れる配置にする
- キャンバスはノード位置に合わせて **動的に拡張**されるため、はみ出しを心配しなくてよい

### 接続タイプ

| type | 見た目 | 意味 |
|------|--------|------|
| `"normal"` | 実線（灰） | 通常フロー |
| `"dashed"` | 破線（灰） | オプション・参照・条件分岐 |
| `"par"` | 実線（紫） | 並列実行 |

### 接続ラベル

`label` フィールドを設定すると **ドラッグ可能な div** としてキャンバス上に表示される。  
分岐の条件（例: `"テンプレあり"` / `"テンプレなし"`）や処理名に使う。

```javascript
{ from: "node_a", to: "node_b", type: "dashed", label: "テンプレあり" }
```

ラベルの位置は接続の中点に自動配置され、ドラッグで調整後は localStorage に保存される。

### フロー設計

1 スキルにつき **2〜3 フロー** を設計する。

- **フロー①**: 全体の主フロー（代表的なノードをカバー）
- **フロー②**: 特徴的なサブフロー（並列・条件分岐・特定ルート）
- **フロー③**: 任意（特に複雑なスキルのみ）

`steps` の `exec`:
- `"claude"` → Claude 自身が実行
- `"sub"` → サブエージェントが実行

---

## Step 4: HTML を生成

1. 最新の `output/html/skill-architecture_*.html` を確認し、次のバージョン番号でコピー
   ```bash
   ls output/html/skill-architecture_*.html
   # → 最大番号+1 で新ファイル名を決定
   cp output/html/skill-architecture_XX.html output/html/skill-architecture_YY.html
   ```
2. `const SKILLS_DATA = {` から閉じる `};` までを設計したデータに **Edit ツールで** 置換
3. `let currentSkillId = '...'` を SKILLS_DATA の **最初のキー** に更新

---

## SKILLS_DATA テンプレート構造

```javascript
const SKILLS_DATA = {
  skill_id: {                        // スネークケース。スキルごとに一意
    name: "表示名",                  // ヘッダーとタブに表示（ブラウザ上でインライン編集可）
    icon: "絵文字",                  // タブ頭に表示
    path: "repo · ローカルパス",     // ヘッダーサブテキスト
    nodes: [
      {
        id: "prefix_name",           // スキル内で一意（他スキルと重複NG）
        label: "表示ラベル",
        x: 数値, y: 数値,            // 大まかでOK。⚡自動整列で後から整える
        w: 数値, h: 44,            // h は最小高さのヒント。実際の高さはテキスト折り返しで自動調整される
        cat: "external|entry|detail|tool|parallel|config|output",
        role: "一行の役割説明",
        desc: "クリック時の詳細説明（2〜3文）",
        meta: { キー: "値" }         // 右パネルに表示するメタ情報
      }
    ],
    connections: [
      { from: "node_id", to: "node_id", type: "normal|dashed|par", label: "任意" }
      // label あり → ドラッグ可能なラベル div として表示（位置は localStorage 保存）
    ],
    flows: [
      {
        id: "flow_id",
        name: "フロー名",
        desc: "フローの説明",
        nodes: ["node_id", ...],      // このフローに含まれるノードID
        conns: ["from→to", ...],      // ハイライトする接続（"from→to" 形式）
        steps: [
          { n: 1, text: "ステップ名", detail: "詳細説明", exec: "claude|sub" }
        ]
      }
    ]
  },
  next_skill_id: { ... }
};
```

---

## Step 5: 生成後の検証（必須・省略禁止）

### 5-1. ファイルを読み直して SKILLS_DATA を確認

```bash
# 生成したファイルの SKILLS_DATA セクションだけ読む
```

Read ツールで生成ファイルの該当箇所を読み直し、以下を目視確認する。

### 5-2. チェックリスト

| チェック項目 | 確認方法 |
|------------|---------|
| ノード `id` がスキル間で重複していない | 全スキルの nodes[].id を横断チェック |
| フローの `conns` が `"from→to"` 形式 | `→` が使われているか（`-` や `:` ではない） |
| `conns` のすべてのペアが `connections` に存在する | flow.conns ↔ connections を突合 |
| `flows[].nodes` に存在しない id が混入していない | nodes[].id 一覧と照合 |
| `currentSkillId` が SKILLS_DATA の最初のキーと一致 | コード上の値を確認 |
| `h: 44` がすべてのノードに設定されている（最小高さのヒント、実高はDOMが自動調整） | ざっと目視 |

### 5-3. 問題があれば自分で修正する

- 問題を発見したら **Edit ツールで即修正** する
- 修正後に該当箇所を再度 Read して直っていることを確認する
- 「確認してみて」でユーザーに丸投げしない
- 修正ループは最大 2 回。2 回直せなければ「〇〇で詰まっています」と報告してユーザーの判断を仰ぐ
