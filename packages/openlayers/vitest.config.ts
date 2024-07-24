import { defineProject } from "vitest/config";
import {resolve} from 'path'

export default defineProject({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test-setup.ts"],
      alias: {
        '@camptocamp/ogc-client': resolve('./mocks/ogc-client.ts')
      }
  },
});
