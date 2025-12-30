import { documentDir, downloadDir, homeDir } from "@tauri-apps/api/path";
import { useEffect, useState } from "react";

export interface Favorite {
	name: string;
	path: string;
}

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
				home.replace(/[\\/]+$/, "").split(/[/\\]/).pop() ?? "Home";

			setFavorites([
				{ name: homeName, path: home },
				{ name: "Applications", path: "/Applications" },
				{ name: "Documents", path: docs },
				{ name: "Downloads", path: downloads },
			]);
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
