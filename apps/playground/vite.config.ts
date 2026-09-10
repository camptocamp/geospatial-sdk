import { existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import ui from "@nuxt/ui/vite";
import tailwindcss from "@tailwindcss/vite";
import { build, defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../..");
const sdkBundleDir = resolve(__dirname, "public/geospatial-sdk");
const sdkPackages = [
  "core",
  "legend",
  "openlayers",
  "maplibre",
  "geocoding",
  "style",
  "elements",
];

async function buildSdkBundles() {
  if (existsSync(sdkBundleDir)) {
    for (const entry of readdirSync(sdkBundleDir)) {
      rmSync(resolve(sdkBundleDir, entry), { recursive: true, force: true });
    }
  }

  for (const packageName of sdkPackages) {
    await build({
      configFile: false,
      root: projectRoot,
      logLevel: "silent",
      build: {
        emptyOutDir: false,
        outDir: sdkBundleDir,
        sourcemap: true,
        minify: false,
        lib: {
          entry: resolve(
            projectRoot,
            "packages",
            packageName,
            "lib",
            "index.ts",
          ),
          formats: ["es"],
          fileName: () => `${packageName}.js`,
        },
        rolldownOptions: {
          output: {
            codeSplitting: false, // we want all dynamic imports to be inlined into the bundle
          },
        },
      },
    });
  }
}

export default defineConfig({
  plugins: [
    vue(),
    ui({
      router: false,
      // colorMode: false,
      components: false,
      autoImport: false,
      icon: {
        clientBundle: {
          scan: true,
        },
      },
    }),
    tailwindcss(),
    {
      name: "geospatial-sdk-bundles",
      async buildStart() {
        await buildSdkBundles();
      },
      configureServer(server) {
        server.watcher.add(resolve(projectRoot, "packages"));
        server.watcher.on("all", (_event, file) => {
          if (
            file.startsWith(projectRoot) &&
            file.includes("/packages/") &&
            !file.includes("/node_modules/")
          ) {
            buildSdkBundles();
          }
        });
      },
    },
  ],
  // publicDir: resolve(__dirname, "public"),
});
