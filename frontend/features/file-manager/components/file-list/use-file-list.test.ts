import {
	formatDate,
	formatSize,
	useFileList,
} from "@features/file-manager/components/file-list/use-file-list";
import { invoke } from "@tauri-apps/api/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
			expect(formatDate(null)).toBe("—");
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
			metadata: { is_dir: false, size: 1024, mtime: 123456790 },
		},
		{
			name: "a_file.txt",
			path: "a_file.txt",
			metadata: { is_dir: false, size: 512, mtime: 123456788 },
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
			expect(result.current.files).toHaveLength(3);
			// Default sort is Name asc
			expect(result.current.files[0].name).toBe("a_file.txt");
			expect(result.current.files[1].name).toBe("file1.txt");
			expect(result.current.files[2].name).toBe("folder1");
		});
	});

	it("should toggle sort by name", async () => {
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

		// Initial: a_file, file1, folder1 (asc)
		expect(result.current.files[0].name).toBe("a_file.txt");

		// Toggle name -> desc
		await act(async () => {
			result.current.toggleSort("name");
		});

		expect(result.current.sortKey).toBe("name");
		expect(result.current.sortOrder).toBe("desc");
		expect(result.current.files[0].name).toBe("folder1");
		expect(result.current.files[1].name).toBe("file1.txt");
		expect(result.current.files[2].name).toBe("a_file.txt");
	});

	it("should sort by size", async () => {
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

		// Toggle size -> asc
		await act(async () => {
			result.current.toggleSort("size");
		});

		expect(result.current.sortKey).toBe("size");
		expect(result.current.sortOrder).toBe("asc");
		// 0, 512, 1024
		expect(result.current.files[0].name).toBe("folder1");
		expect(result.current.files[1].name).toBe("a_file.txt");
		expect(result.current.files[2].name).toBe("file1.txt");
	});

	it("should sort by modified time", async () => {
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

		// Toggle mtime -> asc
		await act(async () => {
			result.current.toggleSort("mtime");
		});

		expect(result.current.sortKey).toBe("mtime");
		expect(result.current.sortOrder).toBe("asc");
		// 123456788, 123456789, 123456790
		expect(result.current.files[0].name).toBe("a_file.txt");
		expect(result.current.files[1].name).toBe("folder1");
		expect(result.current.files[2].name).toBe("file1.txt");
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

		// Default sort: a_file.txt (0), file1.txt (1), folder1 (2)
		// ArrowDown to file1.txt
		await act(async () => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
		});
		expect(result.current.focusedIndex).toBe(1);
		expect(result.current.selectedIndices.has(1)).toBe(true);

		// ArrowDown to folder1
		await act(async () => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
		});
		expect(result.current.focusedIndex).toBe(2);
		expect(result.current.selectedIndices.has(2)).toBe(true);

		// ArrowRight on folder1
		await act(async () => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
		});
		expect(mockOnPathChange).toHaveBeenCalledWith("folder1");
	});
});
