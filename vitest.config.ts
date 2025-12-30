/// <reference types="vitest" />

import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./frontend/test/setup.ts",
		include: ["frontend/**/*.{test,spec}.{ts,tsx}"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./frontend"),
			"@features": path.resolve(__dirname, "./frontend/features"),
			"@shared": path.resolve(__dirname, "./frontend/shared"),
		},
	},
});
