import { documentDir, downloadDir, homeDir } from "@tauri-apps/api/path";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApp } from "@/apps/hooks/use-app";

// Mock Tauri path
vi.mock("@tauri-apps/api/path", () => ({
	homeDir: vi.fn(),
	documentDir: vi.fn(),
	downloadDir: vi.fn(),
}));

describe("useApp hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(homeDir).mockResolvedValue("/home");
		vi.mocked(documentDir).mockResolvedValue("/home/Documents");
		vi.mocked(downloadDir).mockResolvedValue("/home/Downloads");
	});

	it("should initialize currentPath with home directory", async () => {
		const mockHome = "/Users/test";
		vi.mocked(homeDir).mockResolvedValue(mockHome);

		const { result } = renderHook(() => useApp());

		expect(result.current.currentPath).toBe(null);

		await waitFor(() => {
			expect(result.current.currentPath).toBe(mockHome);
		});
	});

	it("should toggle hidden files visibility with Cmd+Shift+.", async () => {
		vi.mocked(homeDir).mockResolvedValue("/home");
		const { result } = renderHook(() => useApp());

		expect(result.current.shouldShowHidden).toBe(false);

		// Trigger Cmd + Shift + .
		await act(async () => {
			window.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: ".",
					metaKey: true,
					shiftKey: true,
				}),
			);
		});

		expect(result.current.shouldShowHidden).toBe(true);

		// Toggle back
		await act(async () => {
			window.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: ".",
					metaKey: true,
					shiftKey: true,
				}),
			);
		});

		expect(result.current.shouldShowHidden).toBe(false);
	});
});
