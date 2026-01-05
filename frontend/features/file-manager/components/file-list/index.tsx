import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { FileRow } from "@features/file-manager/components/file-list/file-row";
import { useAppIcons } from "@features/file-manager/components/file-list/use-app-icons";
import { useFileList } from "@features/file-manager/components/file-list/use-file-list";
import type { FileEntry } from "@features/file-manager/types/fs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@shared/components/ui/table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "@/apps/providers/app-provider";
import { useFileOperations } from "./use-file-operations";

export function FileList() {
	const {
		searchQuery,
		currentPath,
		shouldShowHidden,
		setCurrentPath,
		addFavorite,
		removeFavorite,
		favorites,
	} = useAppContext();

	const {
		files,
		loading,
		selectedIndices,
		hoverPreviewPath,
		rowRefs,
		openApp,
		launchingPath,
		onRowSelect,
		dragState,
		sortKey,
		sortOrder,
		toggleSort,
		refresh,
	} = useFileList({
		searchQuery,
		currentPath,
		shouldShowHidden,
		onPathChange: setCurrentPath,
		onTrash: () => {
			if (selectedIndices.size === 0) return;
			const pathsToTrash = Array.from(selectedIndices)
				.map((index) => files[index]?.path)
				.filter((path): path is string => !!path);
			moveToTrash(pathsToTrash);
		},
	});

	const { appIcons } = useAppIcons(files);
	const { renamingPath, setRenamingPath, rename, moveToTrash } =
		useFileOperations(refresh, addFavorite, removeFavorite);

	const [hoveredPath, setHoveredPath] = useState<string | null>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Enter" && !renamingPath) {
				// Prioritize selected item
				if (selectedIndices.size === 1) {
					const index = Array.from(selectedIndices)[0];
					const file = files[index];
					if (file) {
						e.preventDefault();
						setRenamingPath(file.path);
					}
				}
			}
			if (e.key === "ArrowUp" || e.key === "ArrowDown") {
				setHoveredPath(null);
			}

			// Cmd + Shift + B to add to favorites
			if (
				(e.metaKey || e.ctrlKey) &&
				e.shiftKey &&
				e.key.toLowerCase() === "b"
			) {
				if (hoveredPath) {
					const hoveredFile = files.find((f) => f.path === hoveredPath);
					if (hoveredFile?.metadata.is_dir) {
						e.preventDefault();
						addFavorite(hoveredPath);
					}
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		renamingPath,
		setRenamingPath,
		selectedIndices,
		files,
		hoveredPath,
		addFavorite,
	]);

	const handleOpen = useCallback(
		(file: FileEntry) => {
			if (file.metadata.is_app) {
				openApp(file.path);
			} else if (file.metadata.is_dir) {
				setCurrentPath(
					currentPath === "." ? file.name : `${currentPath}/${file.name}`,
				);
			}
		},
		[currentPath, setCurrentPath, openApp],
	);

	const activeFile =
		dragState.activeId === null
			? null
			: (files.find((file) => file.path === dragState.activeId) ?? null);
	const draggedCount = dragState.draggedPaths.length;
	const dragLabel =
		draggedCount <= 1
			? (activeFile?.name ?? "1 item")
			: `${draggedCount} items`;

	if (loading) {
		return (
			<div className="p-8 text-center text-muted-foreground">
				Scanning repository...
			</div>
		);
	}

	return (
		<DndContext
			sensors={dragState.sensors}
			collisionDetection={closestCenter}
			onDragStart={dragState.handleDragStart}
			onDragMove={dragState.handleDragMove}
			onDragOver={dragState.handleDragOver}
			onDragEnd={dragState.handleDragEnd}
			onDragCancel={dragState.handleDragCancel}
		>
			<div className="w-full">
				<Table>
					<TableHeader className="bg-muted/30 sticky top-0 border-b border-border/40">
						<TableRow className="hover:bg-transparent border-none">
							<TableHead
								className="w-[400px] text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 h-10 cursor-pointer hover:text-muted-foreground transition-colors group"
								onClick={() => toggleSort("name")}
							>
								<div className="flex items-center gap-1">
									Name
									{sortKey === "name" &&
										(sortOrder === "asc" ? (
											<ChevronUp className="h-3 w-3" />
										) : (
											<ChevronDown className="h-3 w-3" />
										))}
								</div>
							</TableHead>
							<TableHead
								className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 h-10 cursor-pointer hover:text-muted-foreground transition-colors group"
								onClick={() => toggleSort("size")}
							>
								<div className="flex items-center gap-1">
									Size
									{sortKey === "size" &&
										(sortOrder === "asc" ? (
											<ChevronUp className="h-3 w-3" />
										) : (
											<ChevronDown className="h-3 w-3" />
										))}
								</div>
							</TableHead>
							<TableHead
								className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 h-10 cursor-pointer hover:text-muted-foreground transition-colors group"
								onClick={() => toggleSort("mtime")}
							>
								<div className="flex items-center gap-1">
									Modified
									{sortKey === "mtime" &&
										(sortOrder === "asc" ? (
											<ChevronUp className="h-3 w-3" />
										) : (
											<ChevronDown className="h-3 w-3" />
										))}
								</div>
							</TableHead>
							<TableHead className="text-right h-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{files.map((file, index) => (
							<FileRow
								key={file.path}
								file={file}
								index={index}
								isSelected={selectedIndices.has(index)}
								isHoverPreview={hoverPreviewPath === file.path}
								isLaunching={launchingPath === file.path}
								isRenaming={renamingPath === file.path}
								isHovered={hoveredPath === file.path}
								isFavorite={favorites.some((f) => f.path === file.path)}
								iconData={appIcons[file.path]}
								onSelect={onRowSelect}
								onOpen={handleOpen}
								onHover={setHoveredPath}
								onRename={rename}
								setRenamingPath={setRenamingPath}
								rowRef={(el) => {
									if (el) rowRefs.current.set(index, el);
									else rowRefs.current.delete(index);
								}}
							/>
						))}
						{files.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={4}
									className="h-24 text-center text-muted-foreground"
								>
									No files found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DragOverlay>
				{dragState.activeId && (
					<div className="rounded-md border bg-background px-3 py-2 text-sm shadow-lg">
						{dragLabel}
					</div>
				)}
			</DragOverlay>
		</DndContext>
	);
}
