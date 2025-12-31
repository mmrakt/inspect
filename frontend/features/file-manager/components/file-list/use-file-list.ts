import {
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useFileSelection } from "@features/file-manager/components/file-list/use-file-selection";
import { useFileSystem } from "@features/file-manager/components/file-list/use-file-system";
import { useKeyboardNavigation } from "@features/file-manager/components/file-list/use-keyboard-navigation";
import type { FileEntry } from "@features/file-manager/types/fs";
import { useDebounce } from "@shared/hooks/use-debounce";
import { invoke } from "@tauri-apps/api/core";
import {
	type MouseEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

export { formatDate, formatSize } from "@shared/lib/format";

interface UseFileListProps {
	searchQuery: string;
	currentPath: string;
	shouldShowHidden: boolean;
	onPathChange: (path: string) => void;
}

interface FolderDropData {
	type: "folder";
	path: string;
}

/**
 * ファイル一覧の取得、選択状態、起動操作など一覧表示に必要な状態と操作を提供する。
 */
export function useFileList({
	searchQuery,
	currentPath,
	shouldShowHidden,
	onPathChange,
}: UseFileListProps) {
	const [files, setFiles] = useState<FileEntry[]>([]);
	const [launchingPath, setLaunchingPath] = useState<string | null>(null);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [draggedPaths, setDraggedPaths] = useState<string[]>([]);
	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());
	const selectionHistory = useRef<Map<string, string>>(new Map());
	const draggedPathsRef = useRef<string[]>([]);
	const hoverTimeoutRef = useRef<number | null>(null);
	const hoverPreviewTimeoutRef = useRef<number | null>(null);
	const hoverExpandTimeoutRef = useRef<number | null>(null);
	const hoverFolderRef = useRef<string | null>(null);
	const lastPointerMoveAtRef = useRef(0);
	const [hoverPreviewPath, setHoverPreviewPath] = useState<string | null>(null);

	const preferredIndex = (() => {
		if (files.length === 0) return null;
		const lastSelectedName = selectionHistory.current.get(currentPath);
		if (!lastSelectedName) return 0;
		const index = files.findIndex((file) => file.name === lastSelectedName);
		return index === -1 ? 0 : index;
	})();

	const {
		focusedIndex,
		selectedIndices,
		selectSingle,
		toggleSelection,
		selectRange,
		selectAll,
	} = useFileSelection({ fileCount: files.length, preferredIndex });

	const rememberSelection = (path: string, name: string) => {
		selectionHistory.current.set(path, name);
	};

	const rememberCurrentSelection = (index: number) => {
		const file = files[index];
		if (file) {
			rememberSelection(currentPath, file.name);
		}
	};

	const selectSingleWithHistory = (index: number) => {
		selectSingle(index);
		rememberCurrentSelection(index);
	};

	const selectRangeWithHistory = (index: number) => {
		selectRange(index);
		rememberCurrentSelection(index);
	};

	const toggleSelectionWithHistory = (index: number) => {
		toggleSelection(index);
		rememberCurrentSelection(index);
	};

	const handleOpenApp = async (path: string) => {
		setLaunchingPath(path);
		setTimeout(() => setLaunchingPath(null), 1000);
		try {
			await invoke("open_app", { path });
		} catch (error) {
			console.error("Failed to open app:", error);
		}
	};

	useKeyboardNavigation({
		files,
		currentPath,
		focusedIndex,
		selectSingle: selectSingleWithHistory,
		selectRange: selectRangeWithHistory,
		selectAll,
		rememberSelection,
		onPathChange,
		onOpenApp: handleOpenApp,
	});

	const handleScanComplete = useCallback((results: FileEntry[]) => {
		setFiles(results);
	}, []);

	const { loading, refresh } = useFileSystem({
		currentPath,
		debouncedSearchQuery,
		shouldShowHidden,
		onScanComplete: handleScanComplete,
	});

	const handleRowSelect = (
		index: number,
		event: MouseEvent<HTMLTableRowElement>,
	) => {
		if (event.shiftKey) {
			selectRangeWithHistory(index);
			return;
		}

		if (event.metaKey || event.ctrlKey) {
			toggleSelectionWithHistory(index);
			return;
		}

		selectSingleWithHistory(index);
	};

	const moveEntries = async (paths: string[], targetDir: string) => {
		try {
			await invoke("move_entries", { paths, targetDir });
			await refresh();
		} catch (error) {
			console.error("Failed to move entries:", error);
		}
	};

	const clearHoverTimer = () => {
		if (hoverTimeoutRef.current !== null) {
			window.clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = null;
		}
		if (hoverPreviewTimeoutRef.current !== null) {
			window.clearTimeout(hoverPreviewTimeoutRef.current);
			hoverPreviewTimeoutRef.current = null;
		}
		if (hoverExpandTimeoutRef.current !== null) {
			window.clearTimeout(hoverExpandTimeoutRef.current);
			hoverExpandTimeoutRef.current = null;
		}
		setHoverPreviewPath(null);
		hoverFolderRef.current = null;
	};

	const scheduleHoverExpand = () => {
		if (!hoverFolderRef.current) return;
		const targetPath = hoverFolderRef.current;
		const scheduledAt = lastPointerMoveAtRef.current;
		setHoverPreviewPath(null);
		if (hoverTimeoutRef.current !== null) {
			window.clearTimeout(hoverTimeoutRef.current);
		}
		if (hoverPreviewTimeoutRef.current !== null) {
			window.clearTimeout(hoverPreviewTimeoutRef.current);
		}
		if (hoverExpandTimeoutRef.current !== null) {
			window.clearTimeout(hoverExpandTimeoutRef.current);
		}
		hoverPreviewTimeoutRef.current = window.setTimeout(() => {
			if (hoverFolderRef.current !== targetPath) return;
			if (lastPointerMoveAtRef.current !== scheduledAt) return;
			setHoverPreviewPath(targetPath);
		}, 200);
		hoverExpandTimeoutRef.current = window.setTimeout(() => {
			if (hoverFolderRef.current !== targetPath) return;
			if (lastPointerMoveAtRef.current !== scheduledAt) return;
			setHoverPreviewPath(null);
			onPathChange(targetPath);
		}, 500);
	};

	const getDraggedPaths = () => draggedPathsRef.current;

	const setDraggedPathsState = (paths: string[]) => {
		draggedPathsRef.current = paths;
		setDraggedPaths(paths);
	};

	const getOverFolderPath = (
		over?: DragOverEvent["over"] | DragEndEvent["over"],
	) => {
		if (!over?.data?.current) return null;
		const data = over.data.current as FolderDropData;
		if (data.type !== "folder") return null;
		return data.path;
	};

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 6 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
			keyboardCodes: {
				start: ["Space"],
				cancel: ["Escape"],
				end: ["Space", "Enter"],
			},
		}),
	);

	const handleDragStart = (event: DragStartEvent) => {
		lastPointerMoveAtRef.current = Date.now();
		const activePath = String(event.active.id);
		setActiveId(activePath);
		const activeIndex = files.findIndex((file) => file.path === activePath);
		if (activeIndex !== -1 && !selectedIndices.has(activeIndex)) {
			selectSingleWithHistory(activeIndex);
			setDraggedPathsState([activePath]);
			return;
		}

		const selectedPaths = files
			.filter((_, index) => selectedIndices.has(index))
			.map((file) => file.path);
		setDraggedPathsState(selectedPaths);
	};

	const handleDragOver = (event: DragOverEvent) => {
		const overFolderPath = getOverFolderPath(event.over);
		if (!overFolderPath) {
			clearHoverTimer();
			return;
		}

		const currentDraggedPaths = getDraggedPaths();
		if (currentDraggedPaths.includes(overFolderPath)) {
			clearHoverTimer();
			return;
		}

		if (hoverFolderRef.current === overFolderPath) {
			return;
		}

		clearHoverTimer();
		hoverFolderRef.current = overFolderPath;
		scheduleHoverExpand();
	};

	const handleDragMove = () => {
		lastPointerMoveAtRef.current = Date.now();
		if (hoverFolderRef.current) {
			scheduleHoverExpand();
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const overFolderPath = getOverFolderPath(event.over);
		clearHoverTimer();
		setActiveId(null);

		const currentDraggedPaths = getDraggedPaths();
		setDraggedPathsState([]);

		if (!overFolderPath || currentDraggedPaths.length === 0) {
			return;
		}

		const isInvalidTarget = currentDraggedPaths.some(
			(path) =>
				overFolderPath === path || overFolderPath.startsWith(`${path}/`),
		);
		if (isInvalidTarget) return;

		void moveEntries(currentDraggedPaths, overFolderPath);
	};

	const handleDragCancel = () => {
		clearHoverTimer();
		setActiveId(null);
		setDraggedPathsState([]);
	};

	useEffect(() => {
		const selectedRow = rowRefs.current.get(focusedIndex);
		if (selectedRow) {
			selectedRow.focus();
			selectedRow.scrollIntoView({ block: "nearest", behavior: "auto" });
		}
	}, [focusedIndex]);

	return {
		files,
		loading,
		focusedIndex,
		selectedIndices,
		hoverPreviewPath,
		rowRefs,
		launchingPath,
		openApp: handleOpenApp,
		onRowSelect: handleRowSelect,
		dragState: {
			activeId,
			draggedPaths,
			sensors,
			handleDragStart,
			handleDragMove,
			handleDragOver,
			handleDragEnd,
			handleDragCancel,
		},
		refresh,
	};
}
