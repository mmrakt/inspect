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
	const pathParts =
		currentPath === "." ? [] : currentPath.split("/").filter(Boolean);

	return (
		<header className="h-14 border-b border-border/60 flex items-center px-4 justify-between bg-background sticky top-0 z-10 shadow-[0_1px_0_0_hsl(var(--border)/0.4)]">
			<Breadcrumb>
				<BreadcrumbList className="font-sans text-xs font-medium text-muted-foreground/60 gap-0 sm:gap-0">
					<BreadcrumbItem className="gap-0">
						<button
							type="button"
							onClick={() => setCurrentPath("/")}
							className="hover:text-foreground px-0.5"
						>
							/
						</button>
					</BreadcrumbItem>
					{pathParts.map((part, i) => (
						<React.Fragment key={pathParts.slice(0, i + 1).join("/")}>
							<BreadcrumbSeparator className="[&>svg]:size-3 opacity-60 mx-0" />
							<BreadcrumbItem className="gap-0">
								<button
									type="button"
									onClick={() =>
										setCurrentPath(`/${pathParts.slice(0, i + 1).join("/")}`)
									}
									className="hover:text-foreground px-0.5"
								>
									{part}
								</button>
							</BreadcrumbItem>
						</React.Fragment>
					))}
				</BreadcrumbList>
			</Breadcrumb>

			<div className="flex items-center gap-4 max-w-md w-full ml-4">
				<div className="relative w-full group">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-focus-within:text-primary/60" />
					<Input
						type="search"
						placeholder="Ask AI or search files..."
						className="pl-9 bg-secondary/30 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/40 h-9 rounded-full shadow-none transition-all"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>
		</header>
	);
}
