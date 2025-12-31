import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@shared/components/ui/breadcrumb";
import { Input } from "@shared/components/ui/input";
import { Search } from "lucide-react";
import React from "react";
import { useAppContext } from "@/apps/providers/app-provider";

export function TopHeader() {
	const { currentPath, setCurrentPath, searchQuery, setSearchQuery } =
		useAppContext();
	const pathParts = currentPath === "." ? [] : currentPath.split("/");

	return (
		<header className="h-14 border-b border-border/60 flex items-center px-4 justify-between bg-background sticky top-0 z-10 shadow-[0_1px_0_0_hsl(var(--border)/0.4)]">
			<Breadcrumb>
				<BreadcrumbList className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground/80">
					<BreadcrumbItem>
						<button
							type="button"
							onClick={() => setCurrentPath(".")}
							className="hover:text-foreground transition-colors"
						>
							inspect
						</button>
					</BreadcrumbItem>
					{pathParts.map((part, i) => (
						<React.Fragment key={pathParts.slice(0, i + 1).join("/")}>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<button
									type="button"
									onClick={() =>
										setCurrentPath(pathParts.slice(0, i + 1).join("/"))
									}
									className="hover:text-foreground transition-colors"
								>
									{part}
								</button>
							</BreadcrumbItem>
						</React.Fragment>
					))}
				</BreadcrumbList>
			</Breadcrumb>

			<div className="flex items-center gap-4 max-w-md w-full ml-4">
				<div className="relative w-full">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary/80" />
					<Input
						type="search"
						placeholder="Ask AI or search files..."
						className="pl-9 bg-secondary/60 border border-border/60 focus-visible:ring-1 focus-visible:ring-primary/80 h-9 shadow-[inset_0_0_0_1px_hsl(var(--border)/0.2)]"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>
		</header>
	);
}
