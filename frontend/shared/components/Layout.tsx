import { Clock, Folder, Hash, Search, Settings } from "lucide-react";
import React from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@shared/components/ui/breadcrumb";
import { Input } from "@shared/components/ui/input";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@shared/components/ui/sidebar";

interface LayoutProps {
	children: React.ReactNode;
	searchQuery: string;
	onSearchChange: (query: string) => void;
	currentPath: string;
	onPathChange: (path: string) => void;
}

export function Layout({
	children,
	searchQuery,
	onSearchChange,
	currentPath,
	onPathChange,
}: LayoutProps) {
	return (
		<SidebarProvider>
			<div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
				<Sidebar className="border-r">
					<SidebarHeader className="p-4">
						<h1 className="text-xl font-bold tracking-tight">inspect</h1>
					</SidebarHeader>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>Project</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton isActive>
											<Folder className="mr-2 h-4 w-4" />
											Files
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton>
											<Clock className="mr-2 h-4 w-4" />
											Recent
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton>
											<Hash className="mr-2 h-4 w-4" />
											Git Changes
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
					<SidebarFooter className="p-4">
						<SidebarMenuButton>
							<Settings className="mr-2 h-4 w-4" />
							Settings
						</SidebarMenuButton>
					</SidebarFooter>
				</Sidebar>

				<main className="flex-1 flex flex-col min-w-0 overflow-hidden">
					<header className="h-14 border-b flex items-center px-4 justify-between bg-background/95 backdrop-blur-sm sticky top-0 z-10">
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<button
										type="button"
										onClick={() => onPathChange(".")}
										className="hover:text-foreground transition-colors"
									>
										inspect
									</button>
								</BreadcrumbItem>
								{currentPath !== "." &&
									currentPath.split("/").map((part, i, arr) => (
										<React.Fragment key={arr.slice(0, i + 1).join("/")}>
											<BreadcrumbSeparator />
											<BreadcrumbItem>
												<button
													type="button"
													onClick={() =>
														onPathChange(arr.slice(0, i + 1).join("/"))
													}
													className="hover:text-foreground transition-colors"
												>
													{part === "." ? "root" : part}
												</button>
											</BreadcrumbItem>
										</React.Fragment>
									))}
							</BreadcrumbList>
						</Breadcrumb>

						<div className="flex items-center gap-4 max-w-md w-full ml-4">
							<div className="relative w-full">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									type="search"
									placeholder="Ask AI or search files..."
									className="pl-9 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-9"
									value={searchQuery}
									onChange={(e) => onSearchChange(e.target.value)}
								/>
							</div>
						</div>
					</header>

					<div className="flex-1 overflow-auto p-0">{children}</div>
				</main>
			</div>
		</SidebarProvider>
	);
}
