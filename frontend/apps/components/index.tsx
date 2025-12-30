import { FileList } from "@features/file-manager/components/file-list";
import { SidebarProvider } from "@shared/components/ui/sidebar";
import { AppProvider } from "@/apps/providers/app-provider";
import { AppSidebar } from "./app-sidebar";
import { TopHeader } from "./top-header";

function AppContent() {
	return (
		<SidebarProvider>
			<div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
				<AppSidebar />
				<main className="flex-1 flex flex-col min-w-0 overflow-hidden">
					<TopHeader />
					<div className="flex-1 overflow-auto p-0">
						<FileList />
					</div>
				</main>
			</div>
		</SidebarProvider>
	);
}

function App() {
	return (
		<AppProvider>
			<AppContent />
		</AppProvider>
	);
}

export default App;
