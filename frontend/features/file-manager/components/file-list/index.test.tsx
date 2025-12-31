import { FileList } from "@features/file-manager/components/file-list/index";
import { invoke } from "@tauri-apps/api/core";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/apps/providers/app-provider";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

// Mock Tauri path
vi.mock("@tauri-apps/api/path", () => ({
	homeDir: vi.fn(() => Promise.resolve(".")),
	documentDir: vi.fn(() => Promise.resolve("Documents")),
	downloadDir: vi.fn(() => Promise.resolve("Downloads")),
}));

// Mock Tauri event
vi.mock("@tauri-apps/api/event", () => ({
	listen: vi.fn(() => Promise.resolve(() => {})),
}));

// Mock Tauri dialog
vi.mock("@tauri-apps/plugin-dialog", () => ({
	message: vi.fn(),
}));

describe("FileList UI", () => {
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

	it("should show basic table structure", async () => {
		vi.mocked(invoke).mockImplementation((cmd) => {
			if (cmd === "scan_directory") return Promise.resolve();
			if (cmd === "search_files") return Promise.resolve(mockFiles);
			return Promise.resolve();
		});

		render(
			<AppProvider>
				<FileList />
			</AppProvider>,
		);

		await waitFor(() =>
			expect(screen.getByText("folder1")).toBeInTheDocument(),
		);

		expect(screen.getByText("Name")).toBeInTheDocument();
		expect(screen.getByText("Size")).toBeInTheDocument();
		expect(screen.getByText("Modified")).toBeInTheDocument();
		expect(screen.getByText("file1.txt")).toBeInTheDocument();
	});

	it("should show empty state when no files", async () => {
		vi.mocked(invoke).mockImplementation((cmd) => {
			if (cmd === "scan_directory") return Promise.resolve();
			if (cmd === "search_files") return Promise.resolve([]);
			return Promise.resolve();
		});

		render(
			<AppProvider>
				<FileList />
			</AppProvider>,
		);

		await waitFor(() =>
			expect(screen.getByText("No files found.")).toBeInTheDocument(),
		);
	});
});
