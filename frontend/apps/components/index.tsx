import { FileList } from "@features/file-manager/components/file-list";
import { SidebarProvider } from "@shared/components/ui/sidebar";
import { useTheme } from "@shared/hooks/use-theme";
import { AppProvider } from "@/apps/providers/app-provider";
import { AppSidebar } from "./app-sidebar";
import { TopHeader } from "./top-header";

function AppContent() {
	return (
		<SidebarProvider>
			<div className="app-shell flex h-screen w-full overflow-hidden text-foreground">
				<AppSidebar />
				<main className="flex-1 flex min-w-0 flex-col overflow-hidden bg-background">
					<TopHeader />
					<div className="flex-1 overflow-auto p-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
						<FileList />
					</div>
				</main>
			</div>
		</SidebarProvider>
	);
}

function App() {
	// Initialize theme system
	useTheme();

	return (
		<AppProvider>
			<AppContent />
		</AppProvider>
	);
}

export default App;
