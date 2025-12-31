import { useFileSelection } from "@features/file-manager/components/file-list/use-file-selection";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("useFileSelection", () => {
	it("selectSingle updates focus and selection", () => {
		const { result } = renderHook(() => useFileSelection({ fileCount: 4 }));

		act(() => {
			result.current.selectSingle(2);
		});

		expect(result.current.focusedIndex).toBe(2);
		expect([...result.current.selectedIndices]).toEqual([2]);
	});

	it("toggleSelection adds additional selections", () => {
		const { result } = renderHook(() => useFileSelection({ fileCount: 3 }));

		act(() => {
			result.current.toggleSelection(1);
		});

		expect([...result.current.selectedIndices].sort()).toEqual([0, 1]);
	});

	it("selectRange uses the anchor index", () => {
		const { result } = renderHook(() => useFileSelection({ fileCount: 5 }));

		act(() => {
			result.current.selectSingle(1);
			result.current.selectRange(3);
		});

		expect([...result.current.selectedIndices].sort()).toEqual([1, 2, 3]);
	});
});
