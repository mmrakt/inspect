import { File, Folder, Loader2 } from "lucide-react";

interface FileIconProps {
	isApp: boolean;
	isDir: boolean;
	isLaunching: boolean;
	iconData?: string;
}

export function FileIcon({
	isApp,
	isDir,
	isLaunching,
	iconData,
}: FileIconProps) {
	return (
		<div className="relative">
			{isApp ? (
				<div className="h-4 w-4 rounded flex items-center justify-center overflow-hidden">
					{iconData ? (
						<img
							src={iconData}
							alt=""
							className="h-full w-full object-contain"
						/>
					) : (
						<div className="h-2.5 w-2.5 rounded-sm bg-primary shadow-sm" />
					)}
				</div>
			) : isDir ? (
				<Folder className="h-4 w-4 text-cyan-500/90 fill-cyan-500/10" />
			) : (
				<File className="h-4 w-4 text-muted-foreground/50" />
			)}
			{isLaunching && (
				<div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 shadow-sm">
					<Loader2 className="h-2 w-2 animate-spin text-primary" />
				</div>
			)}
		</div>
	);
}
