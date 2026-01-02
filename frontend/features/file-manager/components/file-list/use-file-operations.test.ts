import type { Event as TauriEvent } from "@tauri-apps/api/event";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ContextMenuPayload,
	commands,
	events,
} from "@/shared/lib/specta/__generated__";
import { useFileOperations } from "./use-file-operations";

// Mock Specta
vi.mock("@/shared/lib/specta/__generated__", () => ({
	commands: {
		moveToTrash: vi.fn(),
		renameEntry: vi.fn(),
		duplicateEntry: vi.fn(),
	},
	events: {
		contextMenuPayload: {
			listen: vi.fn(),
		},
	},
}));

describe("useFileOperations hook", () => {
	const mockOnOperationComplete = vi.fn();
	const mockAddFavorite = vi.fn();
	const mockRemoveFavorite = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(events.contextMenuPayload.listen).mockResolvedValue(vi.fn());
	});

	it("should call moveToTrash command when triggered", async () => {
		vi.mocked(commands.moveToTrash).mockResolvedValue({
			status: "ok",
			data: null,
		});

		const { result } = renderHook(() =>
			useFileOperations(
				mockOnOperationComplete,
				mockAddFavorite,
				mockRemoveFavorite,
			),
		);

		await act(async () => {
			await result.current.moveToTrash("/test/path");
		});

		expect(commands.moveToTrash).toHaveBeenCalledWith("/test/path");
		expect(mockOnOperationComplete).toHaveBeenCalled();
	});

	it("should call renameEntry command when triggered", async () => {
		vi.mocked(commands.renameEntry).mockResolvedValue({
			status: "ok",
			data: null,
		});

		const { result } = renderHook(() =>
			useFileOperations(
				mockOnOperationComplete,
				mockAddFavorite,
				mockRemoveFavorite,
			),
		);

		await act(async () => {
			await result.current.rename("/test/old-path", "new-name");
		});

		expect(commands.renameEntry).toHaveBeenCalledWith(
			"/test/old-path",
			"new-name",
		);
		expect(mockOnOperationComplete).toHaveBeenCalled();
		expect(result.current.renamingPath).toBe(null);
	});

	it("should call duplicateEntry command when triggered", async () => {
		vi.mocked(commands.duplicateEntry).mockResolvedValue({
			status: "ok",
			data: "/test/path copy",
		});

		const { result } = renderHook(() =>
			useFileOperations(
				mockOnOperationComplete,
				mockAddFavorite,
				mockRemoveFavorite,
			),
		);

		await act(async () => {
			await result.current.duplicate("/test/path");
		});

		expect(commands.duplicateEntry).toHaveBeenCalledWith("/test/path");
		expect(mockOnOperationComplete).toHaveBeenCalled();
	});

	it("should handle context menu events", async () => {
		let eventCallback: (event: TauriEvent<ContextMenuPayload>) => void =
			() => {};

		vi.mocked(events.contextMenuPayload.listen).mockImplementation((cb) => {
			eventCallback = cb;
			return Promise.resolve(vi.fn());
		});

		const { result } = renderHook(() =>
			useFileOperations(
				mockOnOperationComplete,
				mockAddFavorite,
				mockRemoveFavorite,
			),
		);

		// Test Rename event
		await act(async () => {
			eventCallback({
				payload: { action: "rename", path: "/test/path" },
				event: "test",
				id: 1,
			});
		});
		expect(result.current.renamingPath).toBe("/test/path");

		// Test Add Favorite event
		await act(async () => {
			eventCallback({
				payload: { action: "add-favorite", path: "/test/path" },
				event: "test",
				id: 1,
			});
		});
		expect(mockAddFavorite).toHaveBeenCalledWith("/test/path");

		// Test Remove Favorite event
		await act(async () => {
			eventCallback({
				payload: { action: "remove-favorite", path: "/test/path" },
				event: "test",
				id: 1,
			});
		});
		expect(mockRemoveFavorite).toHaveBeenCalledWith("/test/path");
	});
});
