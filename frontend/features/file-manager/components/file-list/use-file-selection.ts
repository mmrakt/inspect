import { useEffect, useRef, useState } from "react";

interface UseFileSelectionOptions {
	fileCount: number;
	preferredIndex?: number | null;
}

export function useFileSelection({
	fileCount,
	preferredIndex,
}: UseFileSelectionOptions) {
	const [focusedIndex, setFocusedIndex] = useState(0);
	const [anchorIndex, setAnchorIndex] = useState(0);
	const anchorIndexRef = useRef(0);
	const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => {
		if (fileCount > 0) return new Set([0]);
		return new Set();
	});

	useEffect(() => {
		if (fileCount === 0) {
			setFocusedIndex(0);
			setAnchorIndex(0);
			setSelectedIndices(new Set());
			return;
		}

		setFocusedIndex((prev) => Math.min(prev, fileCount - 1));
		setAnchorIndex((prev) => {
			const next = Math.min(prev, fileCount - 1);
			anchorIndexRef.current = next;
			return next;
		});
		setSelectedIndices((prev) => {
			const next = new Set<number>();
			for (const index of prev) {
				if (index >= 0 && index < fileCount) {
					next.add(index);
				}
			}
			if (next.size === 0) {
				next.add(0);
			}
			return next;
		});
	}, [fileCount]);

	useEffect(() => {
		if (fileCount === 0) return;
		if (preferredIndex === null || preferredIndex === undefined) return;
		if (preferredIndex < 0 || preferredIndex >= fileCount) return;
		setFocusedIndex(preferredIndex);
		setAnchorIndex(preferredIndex);
		anchorIndexRef.current = preferredIndex;
		setSelectedIndices(new Set([preferredIndex]));
	}, [fileCount, preferredIndex]);

	const selectSingle = (index: number) => {
		if (fileCount === 0) return;
		setFocusedIndex(index);
		setAnchorIndex(index);
		anchorIndexRef.current = index;
		setSelectedIndices(new Set([index]));
	};

	const toggleSelection = (index: number) => {
		if (fileCount === 0) return;
		setFocusedIndex(index);
		setAnchorIndex(index);
		anchorIndexRef.current = index;
		setSelectedIndices((prev) => {
			const next = new Set(prev);
			if (next.has(index)) {
				next.delete(index);
			} else {
				next.add(index);
			}
			if (next.size === 0) {
				next.add(index);
			}
			return next;
		});
	};

	const selectRange = (index: number) => {
		if (fileCount === 0) return;
		const anchor = Number.isInteger(anchorIndexRef.current)
			? anchorIndexRef.current
			: index;
		const start = Math.min(anchor, index);
		const end = Math.max(anchor, index);
		const next = new Set<number>();
		for (let i = start; i <= end; i += 1) {
			next.add(i);
		}
		setFocusedIndex(index);
		setSelectedIndices(next);
	};

	const selectAll = () => {
		if (fileCount === 0) return;
		const next = new Set<number>();
		for (let i = 0; i < fileCount; i += 1) {
			next.add(i);
		}
		setSelectedIndices(next);
	};

	return {
		focusedIndex,
		anchorIndex,
		selectedIndices,
		selectSingle,
		toggleSelection,
		selectRange,
		selectAll,
	};
}
