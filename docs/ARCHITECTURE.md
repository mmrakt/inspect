# 技術スタック / アーキテクチャ設計 / 開発ルールドキュメント

## 1. 全体方針

### 設計思想

* **高速性はRustで担保する**
* **UIは常にノンブロッキング**
* **AI/外部要因でUIが止まらない**
* **責務境界を厳密に分ける**

Finderと違い、
「UIがファイルI/Oを直接叩く」構造は取らない。


## 技術スタック

以下は適宜追加・見直しを実施する

### フロントエンド

* TypeScript
* React
* Tauri Frontend API
* Biome（formatter / linter）
* TailwindCSS/ShadcnUI
* Vite/Vitest
* Bun


### バックエンド

* Rust
* Tauri Backend
* ripgrep（rg）
* notify（fs watcher）
* git2 / libgit2（Git連携）

### AI連携（論理レイヤ）

* LLM API（OpenAI,Gemini,Claude / local LLM 差し替え前提）
* Tool Calling / Function Calling 方式


## 全体アーキテクチャ

```
┌─────────────┐
│   React UI  │
│ (TypeScript)│
└─────▲───────┘
      │ Tauri IPC (async)
┌─────┴───────┐
│  Rust Core  │
│────────────│
│ Indexer    │
│ Search     │
│ Git        │
│ File Ops   │
│ Undo/Log   │
└─────▲───────┘
      │ Tool Interface
┌─────┴───────┐
│ AI Agent    │
│ (Planner)   │
└─────────────┘
```

### 重要ポイント

* **Rust Coreが唯一の真実**
* Reactは「表示と指示」だけ
* AIは「判断」だけで「実行権限なし」


### フロントエンド設計（TypeScript / React）

#### 役割

* 状態表示
* ユーザー入力
* 操作の承認/拒否
* AIとの対話UI

ファイル操作・検索ロジックは一切持たない。


#### 状態管理方針

* UI状態（選択、フォーカス、入力中）はFE管理
* ファイル状態（一覧、検索結果、進捗）はBE主導
* 非同期結果はイベントストリーム的に受信

例:

* 「検索開始」→ command
* 「検索結果更新」→ event
* 「検索完了」→ event


#### UI構成（概念）

* メインペイン: 結果テーブル
* サイドペイン: ツリー / AI / プレビュー
* コマンドパレット: 全操作の入口


### バックエンド設計（Rust）

#### Rust Coreの責務

* ファイルインデックス管理
* 高速検索（rgラップ）
* Git状態取得
* ファイル操作（dry-run含む）
* 操作ログ・Undo管理
* AI向けツールAPI提供


#### インデックス設計

* プロジェクト単位でキャッシュ
* 初回スキャン後は差分更新
* ignoreルール反映（.gitignore + 独自）

インデックスに含める情報例:

* path
* size
* mtime
* file type
* git status
* hit count（最近使われた度）


#### 検索設計

* ripgrepをRustから非同期実行
* 結果はストリームでUIへ送信
* 正規表現 / glob / メタ条件を統合


#### ファイル操作設計

全操作は以下の流れを強制する：

1. plan（操作定義生成）
2. dry-run（影響確認）
3. execute（ユーザー承認後）
4. log（操作記録）
5. undo（可能な限り）

これを崩すAPIは作らない。


### AIエージェント設計

#### AIの立ち位置

* **判断・要約・計画のみ**
* ファイルへの直接アクセスなし
* Rustが公開する「ツール」だけを使用


#### AIツールAPI（例）

* search_files(query, filters)
* get_directory_stats(path)
* get_git_status(path)
* plan_operations(intent)
* dry_run(ops)
* execute(ops_id) ※要ユーザー承認

AIはこれ以上の権限を持たない。


#### AI処理フロー

1. ユーザー入力
2. 意図解析
3. Rustツール呼び出し
4. 結果を構造化してUIへ返却
5. 実行は人間が決定
