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
import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "@/apps/providers/app-provider";
import { useFileOperations } from "./use-file-operations";

export function FileList() {
	const { searchQuery, currentPath, shouldShowHidden, setCurrentPath } =
		useAppContext();

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
		refresh,
	} = useFileList({
		searchQuery,
		currentPath,
		shouldShowHidden,
		onPathChange: setCurrentPath,
	});

	const { appIcons } = useAppIcons(files);
	const { renamingPath, setRenamingPath, rename } = useFileOperations(refresh);

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
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [renamingPath, setRenamingPath, selectedIndices, files]);

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
					<TableHeader className="bg-muted/50 sticky top-0">
						<TableRow>
							<TableHead className="w-[400px]">Name</TableHead>
							<TableHead>Size</TableHead>
							<TableHead>Modified</TableHead>
							<TableHead className="text-right" />
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
