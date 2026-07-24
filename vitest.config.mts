import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    // Résolution native de l'alias `@/*` défini dans tsconfig.json.
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./vitest.setup.ts"],
        css: false,
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
});
