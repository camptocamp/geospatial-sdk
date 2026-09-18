<script setup lang="ts">
import { onMounted, ref } from "vue";
import EditorPane from "./components/EditorPane.vue";
import ResultPane from "./components/ResultPane.vue";
import App from "@nuxt/ui/components/App.vue";
import Button from "@nuxt/ui/components/Button.vue";
import Header from "@nuxt/ui/components/Header.vue";
import NavigationMenu, {
  type NavigationMenuItem,
} from "@nuxt/ui/components/NavigationMenu.vue";
import SelectMenu, {
  type SelectMenuItem,
} from "@nuxt/ui/components/SelectMenu.vue";
import Main from "@nuxt/ui/components/Main.vue";
import Splitter, { type SplitterItem } from "@nuxt/ui/components/Splitter.vue";
import { format } from "prettier";
import * as prettierPluginBabel from "prettier/parser-babel";
import * as prettierPluginJs from "prettier/plugins/estree";
import { DEFAULT_IMPORT_MAP, EXAMPLES } from "./examples/index.js";
import type { PlaygroundCode } from "./model.js";

const navigationItems: NavigationMenuItem[] = [
  {
    label: "Docs",
    to: "../",
    icon: "i-lucide-book-open",
  },
  {
    label: "GitHub",
    to: "https://www.github.com/camptocamp/geospatial-sdk",
    icon: "i-simple-icons-github",
    target: "_blank",
  },
];
const splitterItems: SplitterItem[] = [
  {
    slot: "left",
    minSize: 20,
    defaultSize: 50,
    class: "w-1/2 min-w-0 overflow-hidden",
  },
  {
    slot: "right",
    minSize: 20,
    defaultSize: 50,
    class: "w-1/2 min-w-0 overflow-hidden",
  },
];

async function formatCodeCompact() {
  return await format(currentCode.value.js, {
    parser: "babel",
    plugins: [prettierPluginBabel, prettierPluginJs],
    tabWidth: 0,
    bracketSpacing: false,
    semi: false,
    objectWrap: "collapse",
    printWidth: 300,
  });
}

async function share() {
  const url = new URL(window.location.href);
  url.hash = btoa(await formatCodeCompact());
  console.log(url.toString());
}

type ExampleItem = SelectMenuItem & { value: PlaygroundCode };

const examplesList: ExampleItem[] = EXAMPLES.map((example) => ({
  label: example.name,
  value: example,
}));
const currentExample = ref<ExampleItem | undefined>(undefined);
const currentCode = ref<PlaygroundCode>({
  importMap: DEFAULT_IMPORT_MAP,
  ...EXAMPLES[0],
});

function selectExample(item: ExampleItem) {
  if (!item) return;
  currentExample.value = item;
  currentCode.value = { importMap: DEFAULT_IMPORT_MAP, ...item.value };
  run();
}
function updateCode(newCode: PlaygroundCode) {
  currentExample.value = undefined;
  currentCode.value = { importMap: DEFAULT_IMPORT_MAP, ...newCode };
}

const resultPane = ref<InstanceType<typeof ResultPane> | null>(null);

function run() {
  resultPane.value?.run({ ...currentCode.value });
}

onMounted(() => {
  selectExample(examplesList[0]);
});
</script>

<template>
  <App>
    <Header
      title="Geospatial-SDK Playground"
      to=""
      :ui="{
        root: 'border-0 bg-transparent z-0',
        right: 'pointer-events-none',
        toggle: 'pointer-events-auto',
      }"
    >
      <template #right>
        <NavigationMenu
          :items="navigationItems"
          class="pointer-events-auto"
        ></NavigationMenu>
      </template>
      <template #default>
        <div class="flex flex-row gap-3 w-[30vw] justify-center">
          <SelectMenu
            :items="examplesList"
            class="w-[270px] shrink"
            placeholder="Select a predefined example below"
            :modelValue="currentExample"
            @update:modelValue="selectExample($event)"
          />
          <Button @click="run" icon="i-codicon-run-compact" color="primary">
            Run <small>(Ctrl/Cmd+Enter)</small>
          </Button>
          <Button
            @click="share"
            icon="i-lucide-share-2"
            color="secondary"
            variant="outline"
          >
            Share
          </Button>
          <div class="w-[170px] shrink-0" aria-hidden="true"></div>
        </div>
      </template>
      <template #body>
        <div class="flex flex-col gap-4 items-start">
          <SelectMenu
            :items="examplesList"
            class="min-w-40 grow"
            placeholder="Select a predefined example below"
            :modelValue="currentExample"
            @update:modelValue="selectExample($event)"
          />
          <Button @click="run" icon="i-codicon-run-compact" color="primary">
            Run <small>(Ctrl/Cmd+Enter)</small>
          </Button>
          <Button
            @click="share"
            icon="i-lucide-share-2"
            color="secondary"
            variant="outline"
          >
            Share
          </Button>
        </div>
      </template>
    </Header>
    <Main
      :ui="{
        base: 'flex flex-row flex-auto gap-4 overflow-hidden h-[calc(100vh-var(--ui-header-height))]',
      }"
    >
      <Splitter :items="splitterItems">
        <template #left
          ><EditorPane
            :modelValue="currentCode"
            @update:modelValue="updateCode($event)"
            @run="run"
        /></template>
        <template #right><ResultPane ref="resultPane" /></template>
      </Splitter>
    </Main>
  </App>
</template>

<style scoped></style>
