<script setup lang="ts">
import { useToast } from "@nuxt/ui/runtime/composables/useToast.js";
import { onMounted, onUnmounted, ref, watch } from "vue";
import type { PlaygroundCode } from "../model.js";

const props = defineProps<{ code: PlaygroundCode | null }>();

const toast = useToast();

const iframeRef = ref<HTMLIFrameElement | null>(null);

function buildHtml(code: PlaygroundCode) {
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
${code.importMap}
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
window.addEventListener('error', (event) => {
  parent.postMessage({ type: 'console.error', args: [event.message] }, '${window.location.href}');
});
window.addEventListener('unhandledrejection', (event) => {
  parent.postMessage({ type: 'console.error', args: [event.reason?.message ?? event.reason] }, '${window.location.href}');
});

// trying to import this module to make sure we managed to load the library fully
import('ol/Map.js')
.then(() => {
    // do nothing: it worked
})
.catch((error) => {
  parent.postMessage({ type: 'console.error', args: ['Failed to load OpenLayers, the following error happened', error.message] }, '${window.location.href}');
})
  <\/script>
  </head>
  <body>
    <script type="module">
${code.js}
    <\/script>
${code.html ?? ""}
</body>
</html>`;
}

function onMessage({ data }: MessageEvent) {
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
      duration: 10000,
    });
  }
}

onMounted(() => {
  const iframe = iframeRef.value;
  if (!iframe) return;

  window.addEventListener("message", onMessage);

  // a new code object is received on each run: setting srcdoc reloads the iframe
  // even if the html is identical
  watch(
    () => props.code,
    (code) => {
      iframe.srcdoc = code ? buildHtml(code) : "";
    },
    {
      immediate: true,
    },
  );
});

onUnmounted(() => {
  window.removeEventListener("message", onMessage);
});
</script>

<template>
  <iframe
    ref="iframeRef"
    class="w-auto"
    title="Playground result"
    referrerpolicy="origin"
    sandbox="allow-scripts allow-same-origin"
  />
</template>

<style scoped>
iframe {
  flex: 1 1 auto;
  width: 100%;
  border: 0;
  background: #fff;
}
</style>
