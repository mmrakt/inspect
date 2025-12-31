import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { message } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useState } from "react";

export function useFileOperations(onOperationComplete: () => void) {
	const [renamingPath, setRenamingPath] = useState<string | null>(null);

	const moveToTrash = useCallback(
		async (path: string | string[]) => {
			try {
				const paths = Array.isArray(path) ? path : [path];
				await Promise.all(
					paths.map((p) => invoke("move_to_trash", { path: p })),
				);
				onOperationComplete();
			} catch (error) {
				console.error("Failed to move to trash:", error);
			}
		},
		[onOperationComplete],
	);

	const rename = useCallback(
		async (path: string, newName: string) => {
			try {
				await invoke("rename_entry", { path, newName });
				setRenamingPath(null);
				onOperationComplete();
			} catch (error) {
				console.error("Failed to rename:", error);
				const errorMessage =
					typeof error === "string"
						? error
						: (error as Error)?.message || JSON.stringify(error);

				if (errorMessage.includes("Target already exists")) {
					try {
						await message(
							"A file with this name already exists at this location.",
							{
								title: "Error",
								kind: "error",
							},
						);
					} catch (dialogError) {
						console.error("Failed to show dialog:", dialogError);
					}
				}
			}
		},
		[onOperationComplete],
	);

	const duplicate = useCallback(
		async (path: string) => {
			try {
				await invoke("duplicate_entry", { path });
				onOperationComplete();
			} catch (error) {
				console.error("Failed to duplicate:", error);
			}
		},
		[onOperationComplete],
	);

	useEffect(() => {
		const unlisten = listen<{ action: string; path: string }>(
			"context-menu-action",
			(event) => {
				const { action, path } = event.payload;
				switch (action) {
					case "rename":
						setRenamingPath(path);
						break;
					case "duplicate":
						duplicate(path);
						break;
					case "trash":
						moveToTrash(path);
						break;
				}
			},
		);

		return () => {
			unlisten.then((fn) => fn());
		};
	}, [duplicate, moveToTrash]);

	return {
		renamingPath,
		setRenamingPath,
		moveToTrash,
		rename,
		duplicate,
	};
}
