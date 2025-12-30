import { describe, expect, it } from "vitest";
import { formatDate, formatSize } from "./format";

describe("formatSize", () => {
	it("should format bytes correctly", () => {
		expect(formatSize(0)).toBe("0 B");
		expect(formatSize(1024)).toBe("1 KB");
		expect(formatSize(1024 * 1024)).toBe("1 MB");
		expect(formatSize(1024 * 1024 * 1024)).toBe("1 GB");
	});

	it("should handle fractional sizes", () => {
		expect(formatSize(1500)).toBe("1.46 KB");
		expect(formatSize(1500000)).toBe("1.43 MB");
	});
});

describe("formatDate", () => {
	it("should format timestamp correctly", () => {
		const timestamp = 1704067200; // 2024-01-01 00:00:00 UTC
		const formatted = formatDate(timestamp);
		expect(formatted).not.toBe("-");
		// Locale dependent, so we just check it returns a string with some date-like content
		expect(typeof formatted).toBe("string");
	});

	it("should return '-' for null or 0", () => {
		expect(formatDate(null)).toBe("-");
		expect(formatDate(0)).toBe("-");
	});
});
