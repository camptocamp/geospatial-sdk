<script setup lang="ts">
import { computed, onMounted, toRaw } from "vue";
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
import { EXAMPLES } from "./examples/index.js";
import type { PlaygroundCode } from "./model.js";
import { usePlaygroundCode } from "./composables/usePlaygroundCode.js";

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

const {
  editorCode,
  currentExample,
  runCode,
  updateCode,
  loadExample,
  run,
  getShareUrl,
} = usePlaygroundCode();

async function share() {
  console.log(await getShareUrl());
}

type ExampleItem = SelectMenuItem & { value: PlaygroundCode };

const examplesList: ExampleItem[] = EXAMPLES.map((example) => ({
  label: example.name,
  value: example,
}));
const currentExampleItem = computed(() =>
  examplesList.find((item) => item.value === toRaw(currentExample.value)),
);

function selectExample(item: ExampleItem) {
  if (!item) return;
  loadExample(item.value);
}

onMounted(() => {
  loadExample(EXAMPLES[0]);
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
            class="w-[300px] shrink-0"
            placeholder="Select a predefined example below"
            :modelValue="currentExampleItem"
            @update:modelValue="selectExample($event)"
            :ui="{ content: 'min-w-fit' }"
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
          <div class="w-[220px] shrink-0" aria-hidden="true"></div>
        </div>
      </template>
      <template #body>
        <div class="flex flex-col gap-4 items-start">
          <SelectMenu
            :items="examplesList"
            class="min-w-[270px] grow"
            placeholder="Select a predefined example below"
            :modelValue="currentExampleItem"
            @update:modelValue="selectExample($event)"
            :ui="{ content: 'min-w-fit' }"
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
            :modelValue="editorCode"
            @update:modelValue="updateCode($event)"
            @run="run"
        /></template>
        <template #right><ResultPane :code="runCode" /></template>
      </Splitter>
    </Main>
  </App>
</template>

<style scoped></style>
