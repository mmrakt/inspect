import { documentDir, downloadDir, homeDir } from "@tauri-apps/api/path";
import { useEffect, useState } from "react";

export interface Favorite {
	name: string;
	path: string;
	iconId?: "home" | "documents" | "downloads" | "applications";
}

type FavoriteTemplate = {
	name: string | ((homeName: string) => string);
	path: string | ((home: string, docs: string, downloads: string) => string);
	iconId?: Favorite["iconId"];
};

const DEFAULT_FAVORITES: FavoriteTemplate[] = [
	{
		name: (homeName) => homeName,
		path: (home) => home,
		iconId: "home",
	},
	{
		name: "Applications",
		path: "/Applications",
		iconId: "applications",
	},
	{
		name: "Documents",
		path: (_, docs) => docs,
		iconId: "documents",
	},
	{
		name: "Downloads",
		path: (_, __, downloads) => downloads,
		iconId: "downloads",
	},
];

export function useApp() {
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPath, setCurrentPath] = useState<string | null>(null);
	const [shouldShowHidden, setShouldShowHidden] = useState(false);
	const [favorites, setFavorites] = useState<Favorite[]>([]);

	useEffect(() => {
		const init = async () => {
			const home = await homeDir();
			setCurrentPath(home);

			const docs = await documentDir();
			const downloads = await downloadDir();
			const homeName =
				home
					.replace(/[\\/]+$/, "")
					.split(/[/\\]/)
					.pop() ?? "Home";

			setFavorites(
				DEFAULT_FAVORITES.map((favorite) => ({
					name:
						typeof favorite.name === "function"
							? favorite.name(homeName)
							: favorite.name,
					path:
						typeof favorite.path === "function"
							? favorite.path(home, docs, downloads)
							: favorite.path,
					iconId: favorite.iconId,
				})),
			);
		};

		init();
	}, []);

	useEffect(() => {
		const handleGlobalKeyDown = (e: KeyboardEvent) => {
			// Cmd + Shift + . (Meta + Shift + Dot)
			if (e.metaKey && e.shiftKey && (e.key === "." || e.key === "Period")) {
				e.preventDefault();
				setShouldShowHidden((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleGlobalKeyDown);
		return () => window.removeEventListener("keydown", handleGlobalKeyDown);
	}, []);

	const addFavorite = (path: string) => {
		setFavorites((prev) => {
			if (prev.some((f) => f.path === path)) return prev;

			const name =
				path
					.replace(/[\\/]+$/, "")
					.split(/[/\\]/)
					.pop() ?? "Folder";

			return [...prev, { name, path }];
		});
	};

	return {
		searchQuery,
		setSearchQuery,
		currentPath,
		setCurrentPath,
		shouldShowHidden,
		favorites,
		addFavorite,
	};
}
