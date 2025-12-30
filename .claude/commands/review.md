Review the current changes based on `git diff` from the perspective of a senior engineer proficient in Rust and React.

## 評価基準 (Comprehensive Review Criteria)

### 1. Rust (Backend)
- **Idiomatic Rust**: `clippy` の推奨事項の遵守、適切な `Result`/`Option` の使用。
- **Memory Safety**: `unsafe` の最小化、不必要なクローンの回避（借用の活用）。
- **Performance**: 効率的なイテレータ、データ構造の選択、Lock 競合の最小化（`Mutex`/`RwLock`）。
- **Error Handling**: `anyhow` や `thiserror` の適切な使い分け、コンテキスト情報の付与。

### 2. React & TypeScript (Frontend)
- **Component Design**: 単一責任の原則（SRP）、適切な Props 設計、コンポーネントの肥大化防止。
- **Hooks API**: 依存配列の正確さ、カスタムフックへのロジック抽出、`useCallback`/`useMemo` による最適化。
- **Type Safety**: `any` の禁止、Union Types/Discriminated Unions の活用、型ガードの適切な使用。
- **Architecture**: `features/` と `shared/` の境界遵守。循環参照の防止。

### 3. Tauri & System
- **Security**: 最小権限の原則に基づくコマンド公開（`allowlist`）、安全なパス操作。
- **IPC Interface**: フロントエンドとバックエンド間のデータ構造の整合性、非同期処理の適切な制御。

### 4. General Software Engineering
- **Clean Code**: SOLID 原則の適用、DRY/KISS 遵守。
- **Reliability**: エッジケースを網羅したテスト（正常系・異常系）、リトライ・タイムアウト処理。
- **Accessibility (a11y)**: セマンティック HTML、キーボード操作の網羅（フォーカス管理）。
- **Maintainability**: 明確な命名、将来の拡張性を考慮した設計、冗長なコメントの回避。

## Action
1. `git diff HEAD` で変更点を確認。
2. 上記基準に基づき、具体的かつ建設的なフィードバックを提供。
3. 修正が必要な場合は、具体的なコード例と共に提示。

```sh
// review
git diff HEAD
```
