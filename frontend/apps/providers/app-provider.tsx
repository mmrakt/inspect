import { createContext, type ReactNode, use } from "react";
import { type Favorite, useApp } from "@/apps/hooks/use-app";

interface AppContextType {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	currentPath: string;
	setCurrentPath: (path: string) => void;
	shouldShowHidden: boolean;
	favorites: Favorite[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
	const app = useApp();

	if (app.currentPath === null) {
		return null; // Or a global loading spinner
	}

	return (
		<AppContext
			value={{
				searchQuery: app.searchQuery,
				setSearchQuery: app.setSearchQuery,
				currentPath: app.currentPath,
				setCurrentPath: app.setCurrentPath,
				shouldShowHidden: app.shouldShowHidden,
				favorites: app.favorites,
			}}
		>
			{children}
		</AppContext>
	);
}

export function useAppContext() {
	const context = use(AppContext);
	if (context === undefined) {
		throw new Error("useAppContext must be used within an AppProvider");
	}
	return context;
}
