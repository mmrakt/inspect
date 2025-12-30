import { useIsMobile } from "@shared/hooks/use-mobile";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("useIsMobile", () => {
	it("should return true when window width is less than 768", () => {
		global.window.innerWidth = 500;
		global.window.matchMedia = vi.fn().mockImplementation((query) => ({
			matches: true,
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));

		const { result } = renderHook(() => useIsMobile());
		expect(result.current).toBe(true);
	});

	it("should return false when window width is 768 or more", () => {
		global.window.innerWidth = 1024;
		global.window.matchMedia = vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));

		const { result } = renderHook(() => useIsMobile());
		expect(result.current).toBe(false);
	});
});
