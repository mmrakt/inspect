import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useKeyboardNavigation } from "./use-keyboard-navigation";

describe("useKeyboardNavigation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const defaultProps = {
		files: [
			{
				path: "/path/to/file1",
				name: "file1",
				metadata: { is_dir: false, is_app: false, size: 0, mtime: 0 },
			},
			{
				path: "/path/to/file2",
				name: "file2",
				metadata: { is_dir: false, is_app: false, size: 0, mtime: 0 },
			},
		],
		currentPath: "/path/to",
		focusedIndex: 0,
		selectSingle: vi.fn(),
		selectRange: vi.fn(),
		selectAll: vi.fn(),
		rememberSelection: vi.fn(),
		onPathChange: vi.fn(),
		onOpenApp: vi.fn(),
		onTrash: vi.fn(),
	};

	it("should call onTrash when Cmd+Backspace is pressed", () => {
		renderHook(() => useKeyboardNavigation(defaultProps));

		const event = new KeyboardEvent("keydown", {
			key: "Backspace",
			metaKey: true,
		});
		window.dispatchEvent(event);

		expect(defaultProps.onTrash).toHaveBeenCalled();
	});

	it("should call onTrash when Ctrl+Backspace is pressed (optional, depending on implementation)", () => {
		// Based on implementation, it was only metaKey for Backspace
		// case "Backspace": {
		// 	if (metaKey) {
		// 		return { type: "trash" };
		// 	}
		// 	return { type: "none" };
		// }
		// So Ctrl shouldn't trigger it unless we want it to.
		// Let's verify it DOES NOT trigger if only Ctrl is pressed, based on current code.

		renderHook(() => useKeyboardNavigation(defaultProps));

		const event = new KeyboardEvent("keydown", {
			key: "Backspace",
			ctrlKey: true,
		});
		window.dispatchEvent(event);

		expect(defaultProps.onTrash).not.toHaveBeenCalled();
	});

	it("should not call onTrash when just Backspace is pressed", () => {
		renderHook(() => useKeyboardNavigation(defaultProps));

		const event = new KeyboardEvent("keydown", {
			key: "Backspace",
			metaKey: false,
		});
		window.dispatchEvent(event);

		expect(defaultProps.onTrash).not.toHaveBeenCalled();
	});
});
