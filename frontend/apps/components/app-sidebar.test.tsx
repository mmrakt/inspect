import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/apps/providers/app-provider";
import { commands } from "@/shared/lib/specta/__generated__";
import { AppSidebar } from "./app-sidebar";

// Mock Tauri path
vi.mock("@tauri-apps/api/path", () => ({
	homeDir: vi.fn(() => Promise.resolve("/home/user")),
	documentDir: vi.fn(() => Promise.resolve("/home/user/Documents")),
	downloadDir: vi.fn(() => Promise.resolve("/home/user/Downloads")),
}));

// Mock Specta commands
vi.mock("@/shared/lib/specta/__generated__", () => ({
	commands: {
		showContextMenu: vi.fn(),
	},
}));

// Mock Sidebar components to avoid rendering complexity
vi.mock("@shared/components/ui/sidebar", () => ({
	Sidebar: ({
		children,
		className,
	}: {
		children: React.ReactNode;
		className?: string;
	}) => (
		<div data-testid="sidebar" className={className}>
			{children}
		</div>
	),
	SidebarHeader: ({
		children,
		className,
	}: {
		children: React.ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	SidebarContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SidebarGroup: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SidebarGroupContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SidebarMenu: ({ children }: { children: React.ReactNode }) => (
		<ul>{children}</ul>
	),
	SidebarMenuItem: ({ children }: { children: React.ReactNode }) => (
		<li>{children}</li>
	),
	SidebarMenuButton: ({
		children,
		onClick,
		onContextMenu,
		isActive,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		onContextMenu?: (e: React.MouseEvent) => void;
		isActive?: boolean;
	}) => (
		<button
			type="button"
			onClick={onClick}
			onContextMenu={onContextMenu}
			data-active={isActive}
		>
			{children}
		</button>
	),
	SidebarFooter: ({
		children,
		className,
	}: {
		children: React.ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
}));

describe("AppSidebar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		render(
			<AppProvider>
				<AppSidebar />
			</AppProvider>,
		);
	});

	it("renders title", async () => {
		await waitFor(() =>
			expect(screen.getByText("inspect")).toBeInTheDocument(),
		);
	});

	it("renders favorites after loading", async () => {
		// Wait for favorites to be loaded from useApp init
		await waitFor(
			() => expect(screen.getByText("Applications")).toBeInTheDocument(),
			{ timeout: 2000 },
		);
		expect(screen.getByText("user")).toBeInTheDocument();
		expect(screen.getByText("Documents")).toBeInTheDocument();
		expect(screen.getByText("Downloads")).toBeInTheDocument();
	});

	it("renders SVG icons for default folders", async () => {
		await waitFor(
			() => expect(screen.getByText("Applications")).toBeInTheDocument(),
			{ timeout: 2000 },
		);

		// Applications, Documents, Downloads, Home (user) should have icons
		const icons = screen.getAllByTestId("favorite-icon");
		expect(icons.length).toBe(4);
		// In this test, there are 4 favorites, all should have img because they are all defaults
		// We can check if they are images if we want to be specific
		for (const icon of icons) {
			expect(icon.tagName).toBe("IMG");
		}
	});

	it("triggers context menu with isFavorite=true when right-clicked", async () => {
		await waitFor(() =>
			expect(screen.getByText("Applications")).toBeInTheDocument(),
		);

		const appButton = screen.getByText("Applications").closest("button");
		expect(appButton).toBeInTheDocument();

		if (appButton) {
			fireEvent.contextMenu(appButton);
			expect(commands.showContextMenu).toHaveBeenCalledWith(
				"/Applications",
				true,
			);
		}
	});
});
