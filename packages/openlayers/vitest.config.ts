import { defineProject } from "vitest/config";
import { resolve } from "path";

export default defineProject({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test-setup.ts"],
    alias: {
      "@camptocamp/ogc-client": resolve(__dirname, "./mocks/ogc-client.ts"),
    },
  },
});
