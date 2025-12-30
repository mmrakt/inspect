import type { FileEntry } from "@features/file-manager/types/fs";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";

interface UseFileSystemProps {
	currentPath: string;
	debouncedSearchQuery: string;
	shouldShowHidden: boolean;
	onScanComplete: (files: FileEntry[]) => void;
}

export function useFileSystem({
	currentPath,
	debouncedSearchQuery,
	shouldShowHidden,
	onScanComplete,
}: UseFileSystemProps) {
	const [loading, setLoading] = useState(true);

	const initialScan = useCallback(async () => {
		try {
			setLoading(true);
			const isRecursive = debouncedSearchQuery.length > 0;
			await invoke("scan_directory", {
				path: currentPath,
				recursive: isRecursive,
				showHidden: shouldShowHidden,
			});
			const results = await invoke<FileEntry[]>("search_files", {
				query: debouncedSearchQuery,
			});
			onScanComplete(results);
		} catch (error) {
			console.error("Failed to scan directory:", error);
		} finally {
			setLoading(false);
		}
	}, [debouncedSearchQuery, currentPath, shouldShowHidden, onScanComplete]);

	useEffect(() => {
		initialScan();
	}, [initialScan]);

	return { loading, refresh: initialScan };
}
