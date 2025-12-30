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

interface FileRowProps {
	file: FileEntry;
	index: number;
	isSelected: boolean;
	isLaunching: boolean;
	iconData?: string;
	onSelect: (index: number) => void;
	onOpen: (file: FileEntry) => void;
	rowRef: (el: HTMLTableRowElement | null) => void;
}

export function FileRow({
	file,
	index,
	isSelected,
	isLaunching,
	iconData,
	onSelect,
	onOpen,
	rowRef,
}: FileRowProps) {
	const isApp = file.metadata.is_app;
	const isDir = file.metadata.is_dir;
	const displayName = isApp ? file.name.replace(/\.app$/, "") : file.name;

	return (
		<TableRow
			ref={rowRef}
			className={cn(
				"group cursor-default transition-colors",
				isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted/50",
				isLaunching && "animate-pulse bg-primary/5",
			)}
			onClick={() => onSelect(index)}
			onDoubleClick={() => onOpen(file)}
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
