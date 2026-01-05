import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/apps/providers/app-provider";
import { TopHeader } from "./top-header";

describe("TopHeader", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders breadcrumbs based on current path", async () => {
		render(
			<AppProvider>
				<TopHeader />
			</AppProvider>,
		);

		// Default path from homeDir mock is /home/user
		// and AppProvider splits it.
		// Wait for initial load
		await waitFor(() =>
			expect(
				screen.getByPlaceholderText("Ask AI or search files..."),
			).toBeInTheDocument(),
		);

		// The mock homeDir returns "/home/user" which is absolute.
		// TopHeader logic: currentPath.split("/")
		expect(screen.getByText("home")).toBeInTheDocument();
		expect(screen.getByText("user")).toBeInTheDocument();
	});

	it("updates search query when typing", async () => {
		render(
			<AppProvider>
				<TopHeader />
			</AppProvider>,
		);

		await waitFor(() =>
			expect(
				screen.getByPlaceholderText("Ask AI or search files..."),
			).toBeInTheDocument(),
		);
		const input = screen.getByPlaceholderText(
			"Ask AI or search files...",
		) as HTMLInputElement;

		fireEvent.change(input, { target: { value: "test query" } });
		expect(input.value).toBe("test query");
	});
});
