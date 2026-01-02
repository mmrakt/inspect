import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FileIcon } from "@features/file-manager/components/file-list/file-icon";
import {
	formatDate,
	formatSize,
} from "@features/file-manager/components/file-list/use-file-list";
import type { FileEntry } from "@features/file-manager/types/fs";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { TableCell, TableRow } from "@shared/components/ui/table";
import { cn } from "@shared/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { commands } from "@/shared/lib/specta/__generated__";

interface FileRowProps {
	file: FileEntry;
	index: number;
	isSelected: boolean;
	isHoverPreview: boolean;
	isLaunching: boolean;
	isRenaming: boolean;
	isHovered: boolean;
	isFavorite: boolean;
	iconData?: string;
	onSelect: (index: number, event: MouseEvent<HTMLTableRowElement>) => void;
	onOpen: (file: FileEntry) => void;
	onHover: (path: string | null) => void;
	onRename: (path: string, newName: string) => void;
	setRenamingPath: (path: string | null) => void;
	rowRef: (el: HTMLTableRowElement | null) => void;
}

export function FileRow({
	file,
	index,
	isSelected,
	isHoverPreview,
	isLaunching,
	isRenaming,
	isHovered,
	isFavorite,
	iconData,
	onSelect,
	onOpen,
	onHover,
	onRename,
	setRenamingPath,
	rowRef,
}: FileRowProps) {
	const isApp = file.metadata.is_app;
	const isDir = file.metadata.is_dir;
	const displayName = isApp ? file.name.replace(/\.app$/, "") : file.name;
	const dragData = { type: "file", path: file.path, isDir };

	// Input for rename
	const [renameValue, setRenameValue] = useState(file.name);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isRenaming && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
			setRenameValue(file.name);
		}
	}, [isRenaming, file.name]);

	const {
		attributes,
		listeners,
		setNodeRef: setDraggableRef,
		transform,
		isDragging,
	} = useDraggable({
		id: file.path,
		data: dragData,
		disabled: isRenaming, // Disable drag while renaming
	});

	const { setNodeRef: setDroppableRef, isOver } = useDroppable({
		id: `folder:${file.path}`,
		data: { type: "folder", path: file.path },
		disabled: !isDir,
	});

	const handleSelect = (event: MouseEvent<HTMLTableRowElement>) => {
		if (!isRenaming) {
			onSelect(index, event);
		}
	};

	const handleRowRef = (node: HTMLTableRowElement | null) => {
		setDraggableRef(node);
		setDroppableRef(node);
		rowRef(node);
	};

	const handleRenameSubmit = () => {
		if (renameValue && renameValue !== file.name) {
			onRename(file.path, renameValue);
		} else {
			setRenamingPath(null);
		}
	};

	const handleContextMenu = async (e: MouseEvent<HTMLTableRowElement>) => {
		e.preventDefault();
		if (isRenaming) return;

		// Select the row if not already selected
		if (!isSelected) {
			onSelect(index, e);
		}

		try {
			await commands.showContextMenu(file.path, isFavorite);
		} catch (error) {
			console.error("Failed to open context menu:", error);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			e.stopPropagation();
			handleRenameSubmit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			setRenamingPath(null);
			setRenameValue(file.name);
		}
	};

	return (
		<TableRow
			ref={handleRowRef}
			className={cn(
				"group cursor-default transition-colors focus:outline-none hover:bg-transparent",
				isSelected
					? "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground"
					: isHovered && "bg-muted/50",
				isOver && isDir && "bg-accent/70 text-accent-foreground",
				isHoverPreview &&
					isDir &&
					"bg-primary/20 ring-2 ring-primary/70 shadow-[0_0_0_2px_rgba(59,130,246,0.35)] animate-pulse",
				isLaunching && "animate-pulse bg-primary/5",
				isDragging && "opacity-60",
			)}
			style={{ transform: CSS.Transform.toString(transform) }}
			aria-selected={isSelected}
			onClick={handleSelect}
			onDoubleClick={() => onOpen(file)}
			onMouseEnter={() => onHover(file.path)}
			onMouseLeave={() => onHover(null)}
			onContextMenu={handleContextMenu}
			{...attributes}
			{...listeners}
			tabIndex={isRenaming ? -1 : 0}
		>
			<TableCell className="font-medium flex items-center gap-3 py-2">
				<FileIcon
					isApp={isApp}
					isDir={isDir}
					isLaunching={isLaunching}
					iconData={iconData}
				/>
				{isRenaming ? (
					<Input
						ref={inputRef}
						value={renameValue}
						onChange={(e) => setRenameValue(e.target.value)}
						onBlur={handleRenameSubmit}
						onKeyDown={(e) => {
							// Stop propagation to prevent row/dnd-kit handlers
							e.stopPropagation();
							handleKeyDown(e);
						}}
						onPointerDown={(e) => e.stopPropagation()}
						onMouseDown={(e) => e.stopPropagation()}
						autoFocus
						className="h-7 py-1 px-2 w-full text-foreground select-text"
						onClick={(e) => e.stopPropagation()}
					/>
				) : (
					<span
						className={cn(
							"truncate",
							isLaunching && "text-primary font-semibold",
						)}
					>
						{displayName}
						{isLaunching && (
							<span className="ml-2 text-[10px] font-normal italic opacity-70">
								Launching...
							</span>
						)}
					</span>
				)}
			</TableCell>
			<TableCell className="text-muted-foreground py-2">
				{isDir ? "-" : formatSize(file.metadata.size)}
			</TableCell>
			<TableCell className="text-muted-foreground py-2">
				{formatDate(file.metadata.mtime)}
			</TableCell>
			<TableCell className="text-right py-2">
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={(e) => {
						e.stopPropagation();
						// Trigger context menu manually if clicked
						handleContextMenu(e as unknown as MouseEvent<HTMLTableRowElement>);
					}}
				>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</TableCell>
		</TableRow>
	);
}
