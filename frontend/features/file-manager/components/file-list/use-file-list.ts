import { useDebounce } from "@shared/hooks/use-debounce";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FileEntry } from "../../types/fs";

export function formatSize(bytes: number) {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function formatDate(timestamp: number | null) {
	if (!timestamp) return "-";
	return new Date(timestamp * 1000).toLocaleString();
}

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
	const [loading, setLoading] = useState(true);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());
	const selectionHistory = useRef<Map<string, string>>(new Map());

	useEffect(() => {
		const selectedRow = rowRefs.current.get(selectedIndex);
		if (selectedRow) {
			selectedRow.scrollIntoView({ block: "nearest", behavior: "auto" });
		}
	}, [selectedIndex]);

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
			setFiles(results);

			// Restore selection if available
			const lastSelectedName = selectionHistory.current.get(currentPath);
			if (lastSelectedName) {
				const index = results.findIndex((f) => f.name === lastSelectedName);
				if (index !== -1) {
					setSelectedIndex(index);
				} else {
					setSelectedIndex(0);
				}
			} else {
				setSelectedIndex(0);
			}
		} catch (error) {
			console.error("Failed to scan directory:", error);
		} finally {
			setLoading(false);
		}
	}, [debouncedSearchQuery, currentPath, shouldShowHidden]);

	useEffect(() => {
		initialScan();
	}, [initialScan]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement) return;

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) => {
						const next = Math.min(prev + 1, files.length - 1);
						if (files[next]) {
							selectionHistory.current.set(currentPath, files[next].name);
						}
						return next;
					});
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) => {
						const next = Math.max(prev - 1, 0);
						if (files[next]) {
							selectionHistory.current.set(currentPath, files[next].name);
						}
						return next;
					});
					break;
				case "ArrowRight": {
					e.preventDefault();
					const selectedFile = files[selectedIndex];
					if (selectedFile?.metadata.is_dir) {
						selectionHistory.current.set(currentPath, selectedFile.name);
						const newPath =
							currentPath === "."
								? selectedFile.name
								: `${currentPath}/${selectedFile.name}`;
						onPathChange(newPath);
					}
					break;
				}
				case "ArrowLeft":
					e.preventDefault();
					if (currentPath !== ".") {
						const parts = currentPath.split("/");
						const currentDirName = parts.pop();
						const parentPath = parts.length === 0 ? "." : parts.join("/");
						if (currentDirName) {
							selectionHistory.current.set(parentPath, currentDirName);
						}
						onPathChange(parentPath);
					}
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [files, selectedIndex, currentPath, onPathChange]);

	return {
		files,
		loading,
		selectedIndex,
		setSelectedIndex,
		rowRefs,
	};
}
