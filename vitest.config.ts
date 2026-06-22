import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import path from "path";

export default defineWorkersConfig({
    test: {
        include: ["tests/integration/**/*.test.ts"],
        exclude: ["tests/unit/**", "tests/setup/**"],
        poolOptions: {
            workers: {
                wrangler: { configPath: "./wrangler.jsonc", environment: "dev" },
                miniflare: {
                    compatibilityDate: "2024-01-01",
                    compatibilityFlags: ["nodejs_compat"],
                },
            },
        },
        coverage: {
            provider: "v8",
            reporter: ["text", "html", "lcov"],
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
        testTimeout: 30000,
        globals: true,
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
});
