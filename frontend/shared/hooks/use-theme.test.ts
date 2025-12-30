import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type ThemeMode, useTheme } from "./use-theme";

describe("useTheme", () => {
	let mockLocalStorage: Record<string, string> = {};

	beforeEach(() => {
		// Mock localStorage
		mockLocalStorage = {};
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(
			(key) => mockLocalStorage[key] || null,
		);
		vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
			mockLocalStorage[key] = value;
		});

		// Clear document classes
		document.documentElement.classList.remove("dark");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should default to system mode when no stored preference", () => {
		const { result } = renderHook(() => useTheme());
		expect(result.current.mode).toBe("system");
	});

	it("should load stored theme mode from localStorage", () => {
		mockLocalStorage["theme-mode"] = "dark";
		const { result } = renderHook(() => useTheme());
		expect(result.current.mode).toBe("dark");
	});

	it("should apply dark class when mode is dark", () => {
		const { result } = renderHook(() => useTheme());

		act(() => {
			result.current.setThemeMode("dark");
		});

		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(mockLocalStorage["theme-mode"]).toBe("dark");
	});

	it("should remove dark class when mode is light", () => {
		document.documentElement.classList.add("dark");

		const { result } = renderHook(() => useTheme());

		act(() => {
			result.current.setThemeMode("light");
		});

		expect(document.documentElement.classList.contains("dark")).toBe(false);
		expect(mockLocalStorage["theme-mode"]).toBe("light");
	});

	it("should follow system preference when mode is system", () => {
		const { result } = renderHook(() => useTheme());

		act(() => {
			result.current.setThemeMode("system");
		});

		expect(mockLocalStorage["theme-mode"]).toBe("system");
		// The actual dark class depends on matchMedia mock
	});

	it("should persist theme mode to localStorage", () => {
		const { result } = renderHook(() => useTheme());

		const modes: ThemeMode[] = ["light", "dark", "system"];

		for (const mode of modes) {
			act(() => {
				result.current.setThemeMode(mode);
			});
			expect(mockLocalStorage["theme-mode"]).toBe(mode);
		}
	});
});
