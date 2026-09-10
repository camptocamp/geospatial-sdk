import js from "@eslint/js";
import path from "path";
import { fileURLToPath } from "url";
import typescriptParser from "@typescript-eslint/parser";
import TypescriptEslint from "@typescript-eslint/eslint-plugin";
import Vue from "eslint-plugin-vue";
import EslintPluginImport from "eslint-plugin-import";
import globals from "globals";
import { defineConfig, globalIgnores } from "@eslint/config-helpers";
import { FlatCompat } from "@eslint/eslintrc";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compatWithRecommended = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});
export default defineConfig([
  globalIgnores([
    "node_modules/",
    "**/.vitepress/cache",
    "**/.vitepress/dist",
    "packages/*/dist",
    ".idea",
    ".claude/settings.local.json",
    "**/mocks",
    "**/dist/**",
    "apps",
    "docs",
  ]),
  js.configs.recommended,
  {
    extends: fixupConfigRules(
      compatWithRecommended.extends(
        "plugin:@typescript-eslint/recommended",
        "plugin:vue/vue3-essential",
      ),
    ),
    plugins: {
      "@typescript-eslint": fixupPluginRules(TypescriptEslint),
      vue: fixupPluginRules(Vue),
      import: EslintPluginImport,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parser: typescriptParser,
      sourceType: "module",
      parserOptions: {
        ecmaVersion: "latest",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": 1,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "no-prototype-builtins": "off",
      "import/extensions": [
        "error",
        "always",
        {
          ignorePackages: true,
          pathGroupOverrides: [
            {
              pattern: "ol/{*,*/**}",
              action: "enforce",
            },
          ],
        },
      ],
      "no-constant-binary-expression": "off",
      "no-empty-static-block": "off",
      "no-new-native-nonconstructor": "off",
      "no-unused-private-class-members": "off",
    },
  },
]);
