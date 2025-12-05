import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["server/__tests__/**/*.test.ts"],
    globals: true,
    coverage: {
      reporter: ["text", "html"],
    },
    env: {
      // Ensure DATABASE_URL is not set during tests to use in-memory stores
      DATABASE_URL: "",
    },
  },
});
