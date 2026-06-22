import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        include: ["tests/unit/**/*.test.ts"],
        exclude: ["tests/integration/**", "tests/setup/**"],
        globals: true,
        environment: "node",
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            thresholds: {
                lines: 80,
            },
            exclude: [
                "tests/**",
                "**/*.d.ts",
                "drizzle/**",
                "src/templates/**",
                "src/index.ts",
            ],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@shared/lib": path.resolve(__dirname, "../../packages/lib/src"),
            "@shared/utils": path.resolve(__dirname, "../../packages/utils/src"),
            "@/templates/util": path.resolve(__dirname, "./tests/setup/stubs.ts"),
            "@/templates/otp-template.html": path.resolve(__dirname, "./tests/setup/stubs.ts"),
        },
    },
    assetsInclude: ["**/*.html"],
});
