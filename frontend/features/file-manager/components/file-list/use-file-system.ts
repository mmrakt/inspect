import type { FileEntry } from "@features/file-manager/types/fs";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseFileSystemProps {
	currentPath: string;
	debouncedSearchQuery: string;
	shouldShowHidden: boolean;
	onScanComplete: (files: FileEntry[]) => void;
}

/**
 * ディレクトリ走査と検索結果の取得を行い、読み込み状態を提供する。
 *
 * @param currentPath - 現在のディレクトリパス
 * @param debouncedSearchQuery - デバウンス済みの検索クエリ
 * @param shouldShowHidden - 隠しファイルを表示するかどうか
 * @param onScanComplete - 走査完了時のコールバック
 * @returns 読み込み状態と再取得関数
 */
export function useFileSystem({
	currentPath,
	debouncedSearchQuery,
	shouldShowHidden,
	onScanComplete,
}: UseFileSystemProps) {
	const [loading, setLoading] = useState(true);
	const latestRequestId = useRef(0);

	const scanDirectory = useCallback(async () => {
		const isRecursive = debouncedSearchQuery.length > 0;
		await invoke("scan_directory", {
			path: currentPath,
			recursive: isRecursive,
			showHidden: shouldShowHidden,
		});
	}, [debouncedSearchQuery, currentPath, shouldShowHidden]);

	const searchFiles = useCallback(async () => {
		return invoke<FileEntry[]>("search_files", {
			query: debouncedSearchQuery,
		});
	}, [debouncedSearchQuery]);

	const refresh = useCallback(async () => {
		const requestId = ++latestRequestId.current;
		try {
			setLoading(true);
			await scanDirectory();
			if (latestRequestId.current !== requestId) return;
			const results = await searchFiles();
			if (latestRequestId.current !== requestId) return;
			onScanComplete(results);
		} catch (error) {
			console.error("Failed to scan directory:", error);
		} finally {
			if (latestRequestId.current === requestId) {
				setLoading(false);
			}
		}
	}, [scanDirectory, searchFiles, onScanComplete]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return { loading, refresh };
}
