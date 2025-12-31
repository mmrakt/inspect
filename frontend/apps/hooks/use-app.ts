import { documentDir, downloadDir, homeDir } from "@tauri-apps/api/path";
import { useEffect, useState } from "react";

export interface Favorite {
	name: string;
	path: string;
}

type FavoriteTemplate = {
	name: string | ((homeName: string) => string);
	path: string | ((home: string, docs: string, downloads: string) => string);
};

const DEFAULT_FAVORITES: FavoriteTemplate[] = [
	{
		name: (homeName) => homeName,
		path: (home) => home,
	},
	{
		name: "Applications",
		path: "/Applications",
	},
	{
		name: "Documents",
		path: (_, docs) => docs,
	},
	{
		name: "Downloads",
		path: (_, __, downloads) => downloads,
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

	return {
		searchQuery,
		setSearchQuery,
		currentPath,
		setCurrentPath,
		shouldShowHidden,
		favorites,
	};
}
