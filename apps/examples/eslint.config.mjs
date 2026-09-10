import { defineConfig, globalIgnores } from "@eslint/config-helpers";

export default defineConfig([
  globalIgnores(["logs","*.log","npm-debug.log*","yarn-debug.log*","yarn-error.log*","pnpm-debug.log*","lerna-debug.log*","node_modules",".DS_Store","dist","dist-ssr","coverage","*.local","/cypress/videos/","/cypress/screenshots/",".vscode/*","!.vscode/extensions.json",".idea","*.suo","*.ntvs*","*.njsproj","*.sln","*.sw?","*.tsbuildinfo"]),
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest'
      }
    },
  },
  {
    files: ['**/__tests__/*.{cy,spec}.{js,ts,jsx,tsx}', 'cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}', 'cypress/support/**/*.{js,ts,jsx,tsx}'],
  }
]);
