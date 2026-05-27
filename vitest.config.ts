import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["modules-custom/receipts/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
