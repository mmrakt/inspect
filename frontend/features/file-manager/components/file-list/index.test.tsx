import { FileList } from "@features/file-manager/components/file-list/index";
import { invoke } from "@tauri-apps/api/core";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/apps/providers/app-provider";

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

	it("should move file to trash on Cmd+Backspace", async () => {
		vi.mocked(invoke).mockImplementation((cmd) => {
			if (cmd === "scan_directory") return Promise.resolve();
			if (cmd === "search_files") return Promise.resolve(mockFiles);
			if (cmd === "move_to_trash") return Promise.resolve();
			return Promise.resolve();
		});

		render(
			<AppProvider>
				<FileList />
			</AppProvider>,
		);

		await waitFor(() =>
			expect(screen.getByText("file1.txt")).toBeInTheDocument(),
		);

		// Select the file (click it)
		const row = screen.getByText("file1.txt").closest("tr");
		expect(row).toBeInTheDocument();
		row?.click();

		await waitFor(() => {
			expect(row).toHaveAttribute("aria-selected", "true");
		});

		// Trigger Cmd+Backspace
		const event = new KeyboardEvent("keydown", {
			key: "Backspace",
			metaKey: true,
			bubbles: true,
		});
		window.dispatchEvent(event);

		await waitFor(() => {
			expect(invoke).toHaveBeenCalledWith("move_to_trash", {
				path: "file1.txt",
			});
		});
	});
});
