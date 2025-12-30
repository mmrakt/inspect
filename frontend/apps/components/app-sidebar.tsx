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
import { useAppContext } from "@/apps/providers/app-provider";

export function AppSidebar() {
	const { favorites, currentPath, setCurrentPath } = useAppContext();

	return (
		<Sidebar className="border-r">
			<SidebarHeader className="p-4">
				<h1 className="text-xl font-bold tracking-tight">inspect</h1>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Favorites</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{favorites.map((fav) => (
								<SidebarMenuItem key={fav.path}>
									<SidebarMenuButton
										isActive={currentPath === fav.path}
										onClick={() => setCurrentPath(fav.path)}
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
				<SidebarMenuButton>
					<Settings className="mr-2 h-4 w-4" />
					Settings
				</SidebarMenuButton>
			</SidebarFooter>
		</Sidebar>
	);
}
