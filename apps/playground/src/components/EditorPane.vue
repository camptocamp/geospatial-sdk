<script setup lang="ts">
import { Codemirror } from "vue-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { format } from "prettier";
import * as prettierPluginJs from "prettier/plugins/estree";
import * as prettierPluginBabel from "prettier/plugins/babel";
import { onBeforeMount } from "vue";

const model = defineModel<string>({ required: true });
const emit = defineEmits<{ run: [] }>();

async function formatCode() {
  model.value = await format(model.value, {
    parser: "babel",
    plugins: [prettierPluginBabel, prettierPluginJs],
  });
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

const extensions = [javascript(), oneDark, runKeymap];

onBeforeMount(() => {
  formatCode();
});
</script>

<template>
  <div class="h-full min-w-0 overflow-hidden">
    <Codemirror
      v-model="model"
      :extensions="extensions"
      :style="{ height: '100%' }"
    />
  </div>
</template>

<style scoped></style>
