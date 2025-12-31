import type { FileEntry } from "@features/file-manager/types/fs";
import { useEffect } from "react";

interface UseKeyboardNavigationProps {
	files: FileEntry[];
	currentPath: string;
	focusedIndex: number;
	selectSingle: (index: number) => void;
	selectRange: (index: number) => void;
	selectAll: () => void;
	rememberSelection: (path: string, name: string) => void;
	onPathChange: (path: string) => void;
	onOpenApp: (path: string) => void;
}

type KeyboardAction =
	| { type: "select-all" }
	| { type: "select-single"; index: number }
	| { type: "select-range"; index: number }
	| { type: "open-dir"; path: string; name: string }
	| { type: "open-app"; path: string }
	| { type: "open-parent"; path: string; currentDirName: string | null }
	| { type: "none" };

const getKeyboardAction = ({
	key,
	metaKey,
	ctrlKey,
	shiftKey,
	files,
	focusedIndex,
	currentPath,
}: {
	key: string;
	metaKey: boolean;
	ctrlKey: boolean;
	shiftKey: boolean;
	files: FileEntry[];
	focusedIndex: number;
	currentPath: string;
}): KeyboardAction => {
	if ((metaKey || ctrlKey) && key.toLowerCase() === "a") {
		return { type: "select-all" };
	}

	switch (key) {
		case "ArrowDown": {
			if (files.length === 0) return { type: "none" };
			const index = Math.min(focusedIndex + 1, files.length - 1);
			return shiftKey
				? { type: "select-range", index }
				: { type: "select-single", index };
		}
		case "ArrowUp": {
			if (files.length === 0) return { type: "none" };
			const index = Math.max(focusedIndex - 1, 0);
			return shiftKey
				? { type: "select-range", index }
				: { type: "select-single", index };
		}
		case "ArrowRight":
		case "Enter": {
			if (files.length === 0) return { type: "none" };
			const selectedFile = files[focusedIndex];
			if (selectedFile?.metadata.is_dir) {
				const newPath =
					currentPath === "."
						? selectedFile.name
						: `${currentPath}/${selectedFile.name}`;
				return { type: "open-dir", path: newPath, name: selectedFile.name };
			}
			if (selectedFile?.metadata.is_app) {
				return { type: "open-app", path: selectedFile.path };
			}
			return { type: "none" };
		}
		case "ArrowLeft": {
			if (currentPath === ".") return { type: "none" };
			const parts = currentPath.split("/");
			const currentDirName = parts.pop() ?? null;
			const parentPath = parts.length === 0 ? "." : parts.join("/");
			return { type: "open-parent", path: parentPath, currentDirName };
		}
		default:
			return { type: "none" };
	}
};

/**
 * キーボード操作での選択移動やディレクトリ移動を管理する。
 *
 * @param files - 表示対象のファイル一覧
 * @param currentPath - 現在のディレクトリパス
 * @param focusedIndex - キーボード操作の基準となる選択インデックス
 * @param selectSingle - 単一選択の更新関数
 * @param selectRange - 範囲選択の更新関数
 * @param selectAll - 全選択の更新関数
 * @param rememberSelection - パスごとの選択履歴を保存する関数
 * @param onPathChange - パス遷移時のコールバック
 * @param onOpenApp - アプリ起動時のコールバック
 */
export function useKeyboardNavigation({
	files,
	currentPath,
	focusedIndex,
	selectSingle,
	selectRange,
	selectAll,
	rememberSelection,
	onPathChange,
	onOpenApp,
}: UseKeyboardNavigationProps) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement) return;

			const action = getKeyboardAction({
				key: e.key,
				metaKey: e.metaKey,
				ctrlKey: e.ctrlKey,
				shiftKey: e.shiftKey,
				files,
				focusedIndex,
				currentPath,
			});

			if (action.type === "none") return;

			e.preventDefault();
			switch (action.type) {
				case "select-all":
					selectAll();
					break;
				case "select-single":
					selectSingle(action.index);
					break;
				case "select-range":
					selectRange(action.index);
					break;
				case "open-dir":
					rememberSelection(currentPath, action.name);
					onPathChange(action.path);
					break;
				case "open-app":
					onOpenApp(action.path);
					break;
				case "open-parent":
					if (action.currentDirName) {
						rememberSelection(action.path, action.currentDirName);
					}
					onPathChange(action.path);
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		files,
		currentPath,
		focusedIndex,
		selectSingle,
		selectRange,
		selectAll,
		rememberSelection,
		onPathChange,
		onOpenApp,
	]);
}
