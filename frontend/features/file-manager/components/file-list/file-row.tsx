import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FileIcon } from "@features/file-manager/components/file-list/file-icon";
import {
	formatDate,
	formatSize,
} from "@features/file-manager/components/file-list/use-file-list";
import type { FileEntry } from "@features/file-manager/types/fs";
import { Button } from "@shared/components/ui/button";
import { TableCell, TableRow } from "@shared/components/ui/table";
import { cn } from "@shared/lib/utils";
import { MoreHorizontal } from "lucide-react";
import type { MouseEvent } from "react";

interface FileRowProps {
	file: FileEntry;
	index: number;
	isSelected: boolean;
	isHoverPreview: boolean;
	isLaunching: boolean;
	iconData?: string;
	onSelect: (index: number, event: MouseEvent<HTMLTableRowElement>) => void;
	onOpen: (file: FileEntry) => void;
	rowRef: (el: HTMLTableRowElement | null) => void;
}

export function FileRow({
	file,
	index,
	isSelected,
	isHoverPreview,
	isLaunching,
	iconData,
	onSelect,
	onOpen,
	rowRef,
}: FileRowProps) {
	const isApp = file.metadata.is_app;
	const isDir = file.metadata.is_dir;
	const displayName = isApp ? file.name.replace(/\.app$/, "") : file.name;
	const dragData = { type: "file", path: file.path, isDir };

	const {
		attributes,
		listeners,
		setNodeRef: setDraggableRef,
		transform,
		isDragging,
	} = useDraggable({
		id: file.path,
		data: dragData,
	});

	const { setNodeRef: setDroppableRef, isOver } = useDroppable({
		id: `folder:${file.path}`,
		data: { type: "folder", path: file.path },
		disabled: !isDir,
	});

	const handleSelect = (event: MouseEvent<HTMLTableRowElement>) => {
		onSelect(index, event);
	};

	const handleRowRef = (node: HTMLTableRowElement | null) => {
		setDraggableRef(node);
		setDroppableRef(node);
		rowRef(node);
	};

	return (
		<TableRow
			ref={handleRowRef}
			className={cn(
				"group cursor-default transition-colors",
				isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted/50",
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
			{...attributes}
			{...listeners}
		>
			<TableCell className="font-medium flex items-center gap-3 py-2">
				<FileIcon
					isApp={isApp}
					isDir={isDir}
					isLaunching={isLaunching}
					iconData={iconData}
				/>
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
				>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</TableCell>
		</TableRow>
	);
}
