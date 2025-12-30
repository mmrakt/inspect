import { useFileSystem } from "@features/file-manager/components/file-list/use-file-system";
import { useKeyboardNavigation } from "@features/file-manager/components/file-list/use-keyboard-navigation";
import type { FileEntry } from "@features/file-manager/types/fs";
import { useDebounce } from "@shared/hooks/use-debounce";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";

export { formatDate, formatSize } from "@shared/lib/format";

interface UseFileListProps {
	searchQuery: string;
	currentPath: string;
	shouldShowHidden: boolean;
	onPathChange: (path: string) => void;
}

export function useFileList({
	searchQuery,
	currentPath,
	shouldShowHidden,
	onPathChange,
}: UseFileListProps) {
	const [files, setFiles] = useState<FileEntry[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [launchingPath, setLaunchingPath] = useState<string | null>(null);
	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

	const handleOpenApp = useCallback(async (path: string) => {
		setLaunchingPath(path);
		setTimeout(() => setLaunchingPath(null), 1000);
		try {
			await invoke("open_app", { path });
		} catch (error) {
			console.error("Failed to open app:", error);
		}
	}, []);

	const { selectionHistory } = useKeyboardNavigation({
		files,
		currentPath,
		selectedIndex,
		setSelectedIndex,
		onPathChange,
		onOpenApp: handleOpenApp,
	});

	const handleScanComplete = useCallback(
		(results: FileEntry[]) => {
			setFiles(results);
			const lastSelectedName = selectionHistory.current.get(currentPath);
			const index = lastSelectedName
				? results.findIndex((f) => f.name === lastSelectedName)
				: -1;
			setSelectedIndex(index !== -1 ? index : 0);
		},
		[currentPath, selectionHistory],
	);

	const { loading } = useFileSystem({
		currentPath,
		debouncedSearchQuery,
		shouldShowHidden,
		onScanComplete: handleScanComplete,
	});

	useEffect(() => {
		const selectedRow = rowRefs.current.get(selectedIndex);
		if (selectedRow) {
			selectedRow.scrollIntoView({ block: "nearest", behavior: "auto" });
		}
	}, [selectedIndex]);

	return {
		files,
		loading,
		selectedIndex,
		setSelectedIndex,
		rowRefs,
		launchingPath,
		openApp: handleOpenApp,
	};
}
