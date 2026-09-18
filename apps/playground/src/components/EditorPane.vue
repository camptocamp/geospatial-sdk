<script setup lang="ts">
import { Codemirror } from "vue-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { format } from "prettier";
import * as prettierPluginJs from "prettier/plugins/estree";
import * as prettierPluginBabel from "prettier/plugins/babel";
import { onBeforeMount, ref } from "vue";
import type { PlaygroundCode } from "../model.js";
import Tabs, { type TabsItem } from "@nuxt/ui/components/Tabs.vue";

const model = defineModel<PlaygroundCode>({ required: true });
const emit = defineEmits<{ run: [] }>();

async function formatCode() {
  model.value = {
    ...model.value,
    js: await format(model.value.js, {
      parser: "babel",
      plugins: [prettierPluginBabel, prettierPluginJs],
    }),
  };
}

const runKeymap = Prec.high(
  keymap.of([
    {
      key: "Mod-Enter",
      run: () => {
        formatCode().then(() => emit("run"));
        return true;
      },
    },
  ]),
);

const jsExtensions = [javascript(), oneDark, runKeymap];
const htmlExtensions = [html(), oneDark, runKeymap];
const jsonExtensions = [json(), oneDark, runKeymap];

const tabItems = ref<TabsItem[]>([
  {
    label: "JavaScript",
    value: "js",
  },
  {
    label: "HTML",
    value: "html",
  },
  {
    label: "Import Map",
    value: "importMap",
  },
]);
const activatedTab = ref("js");

onBeforeMount(() => {
  formatCode();
});
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden z-0">
    <Tabs
      color="neutral"
      variant="link"
      :content="false"
      :items="tabItems"
      class="w-full dark:bg-gray-900 bg-emerald-50 z-10"
      v-model="activatedTab"
    />
    <Codemirror
      v-if="activatedTab === 'js'"
      v-model="model.js"
      :extensions="jsExtensions"
      :style="{ flexGrow: 1, flexShrink: 1, height: '400px' }"
    />
    <Codemirror
      v-if="activatedTab === 'html'"
      v-model="model.html"
      :extensions="htmlExtensions"
      :style="{ flexGrow: 1, flexShrink: 1, height: '400px' }"
    />
    <Codemirror
      v-if="activatedTab === 'importMap'"
      v-model="model.importMap"
      :extensions="jsonExtensions"
      :style="{ flexGrow: 1, flexShrink: 1, height: '400px' }"
    />
  </div>
</template>

<style scoped></style>
