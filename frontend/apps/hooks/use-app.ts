import { homeDir } from "@tauri-apps/api/path";
import { useEffect, useState } from "react";

export function useApp() {
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPath, setCurrentPath] = useState<string | null>(null);
	const [shouldShowHidden, setShouldShowHidden] = useState(false);

	useEffect(() => {
		homeDir().then(setCurrentPath);
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
	};
}
