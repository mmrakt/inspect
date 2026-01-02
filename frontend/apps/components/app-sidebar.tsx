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
import applicationsIcon from "@/assets/application.svg";
import documentsIcon from "@/assets/document.svg";
import downloadsIcon from "@/assets/download.svg";
import homeIcon from "@/assets/home.svg";
import { commands } from "@/shared/lib/specta/__generated__";
import { SettingsModal } from "./settings-modal";

const DEFAULT_ICONS: Record<string, string> = {
	home: homeIcon,
	documents: documentsIcon,
	downloads: downloadsIcon,
	applications: applicationsIcon,
};

export function AppSidebar() {
	const { favorites, currentPath, setCurrentPath } = useAppContext();
	const [settingsOpen, setSettingsOpen] = useState(false);

	const handleContextMenu = (e: React.MouseEvent, path: string) => {
		e.preventDefault();
		commands.showContextMenu(path, true);
	};

	return (
		<>
			<Sidebar className="border-r border-border/60 bg-sidebar">
				<SidebarHeader className="p-4 bg-sidebar">
					<h1 className="text-xs font-bold tracking-tight text-foreground/80">
						inspect
					</h1>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-2">
							Favorites
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{favorites.map((fav) => (
									<SidebarMenuItem key={fav.path}>
										<SidebarMenuButton
											isActive={currentPath === fav.path}
											onClick={() => setCurrentPath(fav.path)}
											onContextMenu={(e) => handleContextMenu(e, fav.path)}
											className="hover:bg-sidebar-accent/50 data-[active=true]:bg-primary/10 data-[active=true]:text-primary transition-all px-2 h-9"
										>
											{fav.iconId && DEFAULT_ICONS[fav.iconId] ? (
												<img
													src={DEFAULT_ICONS[fav.iconId]}
													alt=""
													className="mr-3 h-3.5 w-3.5 opacity-70 group-data-[active=true]:opacity-100 invert-0 dark:invert"
													data-testid="favorite-icon"
												/>
											) : (
												<Folder
													className="mr-3 h-3.5 w-3.5 opacity-70 group-data-[active=true]:opacity-100"
													data-testid="favorite-icon"
												/>
											)}
											<span className="text-sm font-medium">{fav.name}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter className="p-2">
					<SidebarMenuButton
						onClick={() => setSettingsOpen(true)}
						className="hover:bg-sidebar-accent/50 text-muted-foreground/70 hover:text-foreground transition-colors px-2 h-9"
					>
						<Settings className="mr-3 h-3.5 w-3.5" />
						<span className="text-sm font-medium">Settings</span>
					</SidebarMenuButton>
				</SidebarFooter>
			</Sidebar>

			<SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
		</>
	);
}
