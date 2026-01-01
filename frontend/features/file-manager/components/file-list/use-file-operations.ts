import { message } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useState } from "react";
import { commands, events } from "@/shared/lib/specta/__generated__";

export function useFileOperations(
	onOperationComplete: () => void,
	addFavorite: (path: string) => void,
) {
	const [renamingPath, setRenamingPath] = useState<string | null>(null);

	const moveToTrash = useCallback(
		async (path: string | string[]) => {
			const paths = Array.isArray(path) ? path : [path];
			for (const p of paths) {
				const res = await commands.moveToTrash(p);
				if (res.status === "error") {
					console.error(`Failed to move ${p} to trash:`, res.error);
				}
			}
			onOperationComplete();
		},
		[onOperationComplete],
	);

	const rename = useCallback(
		async (path: string, newName: string) => {
			const res = await commands.renameEntry(path, newName);
			if (res.status === "ok") {
				setRenamingPath(null);
				onOperationComplete();
			} else {
				console.error("Failed to rename:", res.error);
				const errorMessage = res.error;

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
			const res = await commands.duplicateEntry(path);
			if (res.status === "ok") {
				onOperationComplete();
			} else {
				console.error("Failed to duplicate:", res.error);
			}
		},
		[onOperationComplete],
	);

	useEffect(() => {
		const unlisten = events.contextMenuPayload.listen((event) => {
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
				case "add-favorite":
					addFavorite(path);
					break;
			}
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, [duplicate, moveToTrash, addFavorite]);

	return {
		renamingPath,
		setRenamingPath,
		moveToTrash,
		rename,
		duplicate,
	};
}
