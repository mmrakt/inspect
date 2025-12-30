import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsModal } from "./settings-modal";

// Mock useTheme hook
const mockSetThemeMode = vi.fn();
vi.mock("@shared/hooks/use-theme", () => ({
	useTheme: () => ({
		mode: "system",
		setThemeMode: mockSetThemeMode,
	}),
}));

describe("SettingsModal", () => {
	const mockOnOpenChange = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render when open is true", () => {
		render(<SettingsModal open={true} onOpenChange={mockOnOpenChange} />);

		expect(screen.getByText("Settings")).toBeInTheDocument();
		expect(
			screen.getByText("Customize your application preferences"),
		).toBeInTheDocument();
		expect(screen.getByText("Theme")).toBeInTheDocument();
	});

	it("should not render content when open is false", () => {
		render(<SettingsModal open={false} onOpenChange={mockOnOpenChange} />);

		expect(screen.queryByText("Settings")).not.toBeInTheDocument();
	});

	it("should display theme selector with current mode", () => {
		render(<SettingsModal open={true} onOpenChange={mockOnOpenChange} />);

		const trigger = screen.getByRole("combobox");
		expect(trigger).toBeInTheDocument();
	});

	it("should call setThemeMode when theme is changed", async () => {
		render(<SettingsModal open={true} onOpenChange={mockOnOpenChange} />);

		const trigger = screen.getByRole("combobox");
		fireEvent.click(trigger);

		// Wait for select options to appear and click one
		const darkOption = await screen.findByText("Dark");
		fireEvent.click(darkOption);

		expect(mockSetThemeMode).toHaveBeenCalledWith("dark");
	});
});
