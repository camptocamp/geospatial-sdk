<script setup lang="ts">
import { onMounted, ref } from "vue";
import EditorPane from "./components/EditorPane.vue";
import ResultPane from "./components/ResultPane.vue";
import { DEFAULT_SNIPPET } from "./constants/default-snippet.js";
import App from "@nuxt/ui/components/App.vue";
import Button from "@nuxt/ui/components/Button.vue";
import Header from "@nuxt/ui/components/Header.vue";
import NavigationMenu from "@nuxt/ui/components/NavigationMenu.vue";

const code = ref(DEFAULT_SNIPPET);
const resultPane = ref<InstanceType<typeof ResultPane> | null>(null);

function run() {
  resultPane.value?.run(code.value);
}
onMounted(() => {
  run();
});
</script>

<template>
  <App>
    <div class="w-screen h-screen flex flex-col">
      <Header title="Geospatial-SDK Playground" to="">
        <template #right>
          <NavigationMenu
            :items="[
              {
                label: 'Docs',
                to: '../',
                icon: 'i-lucide-book-open',
              },
              {
                label: 'GitHub',
                to: 'https://www.github.com/camptocamp/geospatial-sdk',
                icon: 'i-simple-icons-github',
                target: '_blank',
              },
            ]"
          ></NavigationMenu>
        </template>
        <template #default>
          <Button @click="run" icon="i-codicon-run-compact" color="secondary">
            Run <small>(Ctrl/Cmd+Enter)</small>
          </Button>
        </template>
      </Header>
      <div class="flex flex-row flex-auto overflow-hidden">
        <EditorPane v-model="code" class="w-1/2" @run="run" />
        <ResultPane ref="resultPane" class="w-1/2" />
      </div>
    </div>
  </App>
</template>

<style scoped></style>
