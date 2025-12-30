import type { FileEntry } from "@features/file-manager/types/fs";
import { useCallback, useEffect, useMemo, useRef } from "react";

interface UseKeyboardNavigationProps {
	files: FileEntry[];
	currentPath: string;
	selectedIndex: number;
	setSelectedIndex: (index: number) => void;
	onPathChange: (path: string) => void;
	onOpenApp: (path: string) => void;
}

export function useKeyboardNavigation({
	files,
	currentPath,
	selectedIndex,
	setSelectedIndex,
	onPathChange,
	onOpenApp,
}: UseKeyboardNavigationProps) {
	const selectionHistory = useRef<Map<string, string>>(new Map());

	const updateSelection = useCallback(
		(index: number) => {
			setSelectedIndex(index);
			if (files[index]) {
				selectionHistory.current.set(currentPath, files[index].name);
			}
		},
		[files, currentPath, setSelectedIndex],
	);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement) return;

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					updateSelection(Math.min(selectedIndex + 1, files.length - 1));
					break;
				case "ArrowUp":
					e.preventDefault();
					updateSelection(Math.max(selectedIndex - 1, 0));
					break;
				case "ArrowRight":
				case "Enter": {
					e.preventDefault();
					const selectedFile = files[selectedIndex];
					if (selectedFile?.metadata.is_dir) {
						selectionHistory.current.set(currentPath, selectedFile.name);
						const newPath =
							currentPath === "."
								? selectedFile.name
								: `${currentPath}/${selectedFile.name}`;
						onPathChange(newPath);
					} else if (selectedFile?.metadata.is_app) {
						onOpenApp(selectedFile.path);
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
	}, [
		files,
		selectedIndex,
		currentPath,
		onPathChange,
		onOpenApp,
		updateSelection,
	]);

	return useMemo(() => ({ selectionHistory }), []);
}
