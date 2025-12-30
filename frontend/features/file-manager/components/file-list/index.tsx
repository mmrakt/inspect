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
import { useCallback } from "react";
import { useAppContext } from "@/apps/providers/app-provider";

export function FileList() {
	const { searchQuery, currentPath, shouldShowHidden, setCurrentPath } =
		useAppContext();

	const {
		files,
		loading,
		selectedIndex,
		setSelectedIndex,
		rowRefs,
		openApp,
		launchingPath,
	} = useFileList({
		searchQuery,
		currentPath,
		shouldShowHidden,
		onPathChange: setCurrentPath,
	});

	const { appIcons } = useAppIcons(files);

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
						<TableHead className="text-right" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{files.map((file, index) => (
						<FileRow
							key={file.path}
							file={file}
							index={index}
							isSelected={selectedIndex === index}
							isLaunching={launchingPath === file.path}
							iconData={appIcons[file.path]}
							onSelect={setSelectedIndex}
							onOpen={handleOpen}
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
	);
}
