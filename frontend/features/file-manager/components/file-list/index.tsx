import { Button } from "@shared/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@shared/components/ui/table";
import { cn } from "@shared/lib/utils";
import { File, Folder, MoreHorizontal } from "lucide-react";
import { formatDate, formatSize, useFileList } from "./use-file-list";

export function FileList({
	searchQuery,
	currentPath,
	shouldShowHidden,
	onPathChange,
}: {
	searchQuery: string;
	currentPath: string;
	shouldShowHidden: boolean;
	onPathChange: (path: string) => void;
}) {
	const { files, loading, selectedIndex, setSelectedIndex, rowRefs } =
		useFileList({
			searchQuery,
			currentPath,
			shouldShowHidden,
			onPathChange,
		});

	if (loading) {
		return (
			<div className="p-8 text-center text-muted-foreground">
				Scanning repository...
			</div>
		);
	}

	return (
		<div className="w-full">
			<Table>
				<TableHeader className="bg-muted/50 sticky top-0">
					<TableRow>
						<TableHead className="w-[400px]">Name</TableHead>
						<TableHead>Size</TableHead>
						<TableHead>Modified</TableHead>
						<TableHead className="text-right"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{files.map((file, index) => (
						<TableRow
							key={file.path}
							ref={(el) => {
								if (el) rowRefs.current.set(index, el);
								else rowRefs.current.delete(index);
							}}
							className={cn(
								"group cursor-default transition-colors",
								selectedIndex === index
									? "bg-accent text-accent-foreground"
									: "hover:bg-muted/50",
							)}
							onClick={() => setSelectedIndex(index)}
						>
							<TableCell className="font-medium flex items-center gap-3 py-2">
								{file.metadata.is_dir ? (
									<Folder className="h-4 w-4 text-blue-400 fill-blue-400/20" />
								) : (
									<File className="h-4 w-4 text-muted-foreground" />
								)}
								<span className="truncate">{file.name}</span>
							</TableCell>
							<TableCell className="text-muted-foreground py-2">
								{file.metadata.is_dir ? "-" : formatSize(file.metadata.size)}
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
	);
}
