import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "theme-mode";

export function useTheme() {
	const [mode, setMode] = useState<ThemeMode>(() => {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		return (stored as ThemeMode) || "system";
	});

	useEffect(() => {
		const applyTheme = (isDark: boolean) => {
			if (isDark) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
		};

		if (mode === "light") {
			applyTheme(false);
		} else if (mode === "dark") {
			applyTheme(true);
		} else {
			// system mode
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

			const updateTheme = (e: MediaQueryList | MediaQueryListEvent) => {
				applyTheme(e.matches);
			};

			// Set initial theme
			updateTheme(mediaQuery);

			// Listen for changes
			mediaQuery.addEventListener("change", updateTheme);

			return () => {
				mediaQuery.removeEventListener("change", updateTheme);
			};
		}
	}, [mode]);

	const setThemeMode = (newMode: ThemeMode) => {
		setMode(newMode);
		localStorage.setItem(THEME_STORAGE_KEY, newMode);
	};

	return { mode, setThemeMode };
}
