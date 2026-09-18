<script setup lang="ts">
import { useToast } from "@nuxt/ui/runtime/composables/useToast.js";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { PlaygroundCode } from "../model.js";

const toast = useToast();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const code = ref<PlaygroundCode | null>(null);

const run = async (input: PlaygroundCode) => {
  // we're clearing and setting the code to force the iframe to reload
  code.value = null;
  await nextTick();
  code.value = input;
};

const fullHtml = computed(() => {
  if (!code.value) {
    return "";
  }
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
${code.value.importMap}
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
${code.value.js}
    <\/script>
${code.value.html ?? ""}
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
        duration: 10000,
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
