import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.matchMedia for jsdom
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

if (!window.HTMLElement.prototype.scrollIntoView) {
	window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Global mocks for Tauri APIs
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/path", () => ({
	homeDir: vi.fn(() => Promise.resolve("/home/user")),
	documentDir: vi.fn(() => Promise.resolve("/home/user/Documents")),
	downloadDir: vi.fn(() => Promise.resolve("/home/user/Downloads")),
}));

vi.mock("@tauri-apps/api/event", () => ({
	listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
	message: vi.fn(),
}));
