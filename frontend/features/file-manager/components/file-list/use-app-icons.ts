import type { FileEntry } from "@features/file-manager/types/fs";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";

/**
 * アプリファイルのアイコンを取得・キャッシュする。
 *
 * @param files - 表示対象のファイル一覧
 * @returns アプリパスとアイコン文字列の対応表
 */
export function useAppIcons(files: FileEntry[]) {
	const [appIcons, setAppIcons] = useState<Record<string, string>>({});
	const appIconsRef = useRef<Record<string, string>>({});
	const fetchingIcons = useRef<Set<string>>(new Set());

	useEffect(() => {
		const fetchIcons = async () => {
			const apps = files.filter((f) => f.metadata.is_app);
			for (const app of apps) {
				if (
					!appIconsRef.current[app.path] &&
					!fetchingIcons.current.has(app.path)
				) {
					fetchingIcons.current.add(app.path);
					try {
						const icon = await invoke<string>("get_app_icon", {
							path: app.path,
						});
						setAppIcons((prev) => {
							const next = { ...prev, [app.path]: icon };
							appIconsRef.current = next;
							return next;
						});
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
	}, [files]);

	return { appIcons };
}
