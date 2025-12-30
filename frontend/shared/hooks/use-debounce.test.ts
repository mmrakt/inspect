import { useDebounce } from "@shared/hooks/use-debounce";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("useDebounce", () => {
	vi.useFakeTimers();

	it("should return initial value immediately", () => {
		const { result } = renderHook(() => useDebounce("test", 500));
		expect(result.current).toBe("test");
	});

	it("should update value after delay", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{
				initialProps: { value: "test", delay: 500 },
			},
		);

		rerender({ value: "updated", delay: 500 });
		expect(result.current).toBe("test");

		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(result.current).toBe("updated");
	});

	it("should clear timeout on unmount", () => {
		const spy = vi.spyOn(global, "clearTimeout");
		const { unmount } = renderHook(() => useDebounce("test", 500));
		unmount();
		expect(spy).toHaveBeenCalled();
	});
});
