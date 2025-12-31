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
} from "@shared/components/ui/sidebar";
import { Folder, Settings } from "lucide-react";
import { useState } from "react";
import { useAppContext } from "@/apps/providers/app-provider";
import { SettingsModal } from "./settings-modal";

export function AppSidebar() {
	const { favorites, currentPath, setCurrentPath } = useAppContext();
	const [settingsOpen, setSettingsOpen] = useState(false);

	return (
		<>
			<Sidebar className="border-r border-border/60 bg-sidebar">
				<SidebarHeader className="p-4 border-b border-border/50 bg-sidebar">
					<h1 className="text-[11px] font-semibold tracking-[0.32em] uppercase font-mono text-muted-foreground">
						inspect
					</h1>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70">
							Favorites
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{favorites.map((fav) => (
									<SidebarMenuItem key={fav.path}>
										<SidebarMenuButton
											isActive={currentPath === fav.path}
											onClick={() => setCurrentPath(fav.path)}
											className="hover:bg-sidebar-accent/70 data-[active=true]:bg-sidebar-accent/80"
										>
											<Folder className="mr-2 h-4 w-4" />
											{fav.name}
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter className="p-4">
					<SidebarMenuButton
						onClick={() => setSettingsOpen(true)}
						className="hover:bg-sidebar-accent/70"
					>
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</SidebarMenuButton>
				</SidebarFooter>
			</Sidebar>

			<SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
		</>
	);
}
