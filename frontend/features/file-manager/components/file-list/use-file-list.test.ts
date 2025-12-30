import { invoke } from "@tauri-apps/api/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatSize, useFileList } from "./use-file-list";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

describe("useFileList utils", () => {
	describe("formatSize", () => {
		it("should format bytes correctly", () => {
			expect(formatSize(0)).toBe("0 B");
			expect(formatSize(1024)).toBe("1 KB");
			expect(formatSize(1024 * 1024)).toBe("1 MB");
		});
	});

	describe("formatDate", () => {
		it("should return '-' for null timestamp", () => {
			expect(formatDate(null)).toBe("-");
		});

		it("should format timestamp correctly", () => {
			const ts = 1700000000;
			expect(formatDate(ts)).toContain("2023");
		});
	});
});

describe("useFileList hook", () => {
	const mockOnPathChange = vi.fn();
	const mockFiles = [
		{
			name: "folder1",
			path: "folder1",
			metadata: { is_dir: true, size: 0, mtime: 123456789 },
		},
		{
			name: "file1.txt",
			path: "file1.txt",
			metadata: { is_dir: false, size: 1024, mtime: 123456789 },
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
		window.HTMLElement.prototype.scrollIntoView = vi.fn();
	});

	it("should fetch files on mount with shallow scan", async () => {
		vi.mocked(invoke).mockImplementation((cmd, args) => {
			if (cmd === "scan_directory") {
				expect(args).toEqual({
					path: ".",
					recursive: false,
					showHidden: false,
				});
				return Promise.resolve();
			}
			if (cmd === "search_files") return Promise.resolve(mockFiles);
			return Promise.resolve();
		});

		const { result } = renderHook(() =>
			useFileList({
				searchQuery: "",
				currentPath: ".",
				shouldShowHidden: false,
				onPathChange: mockOnPathChange,
			}),
		);

		expect(result.current.loading).toBe(true);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
			expect(result.current.files).toHaveLength(2);
			expect(result.current.files[0].name).toBe("folder1");
		});
	});

	it("should handle navigation keyboard events", async () => {
		vi.mocked(invoke).mockImplementation((cmd) => {
			if (cmd === "scan_directory") return Promise.resolve();
			if (cmd === "search_files") return Promise.resolve(mockFiles);
			return Promise.resolve();
		});

		const { result } = renderHook(() =>
			useFileList({
				searchQuery: "",
				currentPath: ".",
				shouldShowHidden: false,
				onPathChange: mockOnPathChange,
			}),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		// ArrowDown
		await act(async () => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
		});
		expect(result.current.selectedIndex).toBe(1);

		// ArrowRight on folder
		await act(async () => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
		});
		// Since currentPath is ".", nothing happens
		expect(mockOnPathChange).not.toHaveBeenCalled();

		// ArrowUp
		await act(async () => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
		});
		expect(result.current.selectedIndex).toBe(0);

		// ArrowRight on folder1
		await act(async () => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
		});
		expect(mockOnPathChange).toHaveBeenCalledWith("folder1");
	});
});
