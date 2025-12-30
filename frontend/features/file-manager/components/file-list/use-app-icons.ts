import type { FileEntry } from "@features/file-manager/types/fs";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";

export function useAppIcons(files: FileEntry[]) {
	const [appIcons, setAppIcons] = useState<Record<string, string>>({});
	const fetchingIcons = useRef<Set<string>>(new Set());

	useEffect(() => {
		const fetchIcons = async () => {
			const apps = files.filter((f) => f.metadata.is_app);
			for (const app of apps) {
				if (!appIcons[app.path] && !fetchingIcons.current.has(app.path)) {
					fetchingIcons.current.add(app.path);
					try {
						const icon = await invoke<string>("get_app_icon", {
							path: app.path,
						});
						setAppIcons((prev) => ({ ...prev, [app.path]: icon }));
					} catch (e) {
						console.error("Failed to fetch icon for", app.name, e);
					} finally {
						fetchingIcons.current.delete(app.path);
					}
				}
			}
		};

		if (files.length > 0) {
			fetchIcons();
		}
	}, [files, appIcons]);

	return { appIcons };
}
