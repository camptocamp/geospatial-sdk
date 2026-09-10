<script setup lang="ts">
import { useToast } from "@nuxt/ui/runtime/composables/useToast.js";
import { computed, nextTick, onMounted, ref, watch } from "vue";

const toast = useToast();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const code = ref<string>();

const run = async (input: string) => {
  // we're clearing and setting the code to force the iframe to reload
  code.value = "";
  await nextTick();
  code.value = input;
};

const packagesRoot = new URL("./geospatial-sdk", window.location.href);

const fullHtml = computed(() => {
  return `<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Playground Result</title>
    <style>
      html,
      body,
      #map {
        height: 100%;
        margin: 0;
      }
    </style>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/ol@10.10.0/ol.css" />
    <script type="importmap">
{
  "imports": {
    "ol/": "https://unpkg.com/ol@10.10.0/",
    "maplibre-gl": "https://unpkg.com/maplibre-gl@^5.19.0/dist/maplibre-gl.js",
    "earcut": "https://unpkg.com/earcut@^3.0.0",
    "geotiff": "https://unpkg.com/geotiff@^3.1.0-beta.0",
    "pbf": "https://unpkg.com/pbf@5.1.2",
    "rbush": "https://unpkg.com/rbush@^4.0.0/index.js",
    "quickselect": "https://unpkg.com/quickselect@^3.0.0/index.js",
    "zarrita": "https://unpkg.com/zarrita@^0.7.1",
    "@geospatial-sdk/core": "${packagesRoot}/core.js",
    "@geospatial-sdk/legend": "${packagesRoot}/legend.js",
    "@geospatial-sdk/openlayers": "${packagesRoot}/openlayers.js",
    "@geospatial-sdk/maplibre": "${packagesRoot}/maplibre.js",
    "@geospatial-sdk/geocoding": "${packagesRoot}/geocoding.js",
    "@geospatial-sdk/style": "${packagesRoot}/style.js",
    "@geospatial-sdk/elements": "${packagesRoot}/elements.js"
  }
}
    <\/script>
    <script>

// override console calls
const originalLog = console.log;
console.log = (...args) => {
  parent.postMessage({ type: 'console.log', args }, '${window.location.href}');
  originalLog(...args);
};
const originalWarn = console.warn;
console.warn = (...args) => {
  parent.postMessage({ type: 'console.warn', args }, '${window.location.href}');
  originalWarn(...args);
};
const originalError = console.error;
console.error = (...args) => {
  parent.postMessage({ type: 'console.error', args }, '${window.location.href}');
  originalError(...args);
};
  <\/script>
  </head>
  <body>
    <div id="map"></div>
    <script type="module">
${code.value}
    <\/script>

    <div style="position: absolute; bottom: 4px; left: 4px">
      <button type="button" class="toggle-layer"></button>
      <button type="button" class="toggle-layer"></button>
      <button type="button" class="toggle-layer"></button>
      <button type="button" class="toggle-layer"></button>
    </div>
</body>
</html>`;
});

onMounted(() => {
  const iframe = iframeRef.value;
  if (!iframe) return;

  window.addEventListener("message", ({ data }) => {
    if (!data.type?.startsWith("console.")) return;

    // catch console logs from the iframe and show them as toasts
    const args = data.args;
    if (data.type === "console.log") {
      toast.add({
        description: args.join(" "),
        icon: "i-lucide-message-circle",
        color: "info",
      });
    } else if (data.type === "console.warn") {
      toast.add({
        description: args.join(" "),
        icon: "i-lucide-message-circle-warning",
        color: "warning",
      });
    } else if (data.type === "console.error") {
      toast.add({
        description: args.join(" "),
        icon: "i-lucide-siren",
        color: "error",
      });
    }
  });

  watch(
    fullHtml,
    (newHtml) => {
      iframe.srcdoc = newHtml;
    },
    {
      immediate: true,
    },
  );
});

defineExpose({
  run,
});
</script>

<template>
  <div class="h-full min-w-0">
    <iframe
      ref="iframeRef"
      class="h-full"
      title="Playground result"
      referrerpolicy="origin"
      sandbox="allow-scripts allow-same-origin"
    />
  </div>
</template>

<style scoped>
iframe {
  flex: 1 1 auto;
  width: 100%;
  border: 0;
  background: #fff;
}
</style>
