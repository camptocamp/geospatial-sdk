import { readonly, ref } from "vue";
import { format } from "prettier";
import * as prettierPluginBabel from "prettier/plugins/babel";
import * as prettierPluginJs from "prettier/plugins/estree";
import { DEFAULT_IMPORT_MAP } from "../examples/index.js";
import type { PlaygroundCode } from "../model.js";

const prettierPlugins = [prettierPluginBabel, prettierPluginJs];

async function formatJs(js: string): Promise<string> {
  try {
    return await format(js, { parser: "babel", plugins: prettierPlugins });
  } catch {
    // syntax errors are left as is so that they show up when running the code
    return js;
  }
}

function formatJsCompact(js: string): Promise<string> {
  return format(js, {
    parser: "babel",
    plugins: prettierPlugins,
    tabWidth: 0,
    bracketSpacing: false,
    semi: false,
    objectWrap: "collapse",
    printWidth: 300,
  });
}

function withDefaults(code: PlaygroundCode): PlaygroundCode {
  return { importMap: DEFAULT_IMPORT_MAP, ...code };
}

/**
 * Holds the code shown in the editor, formats it and decides what code
 * the result pane should run.
 */
export function usePlaygroundCode() {
  const editorCode = ref<PlaygroundCode>({ js: "" });
  const currentExample = ref<PlaygroundCode | undefined>(undefined);
  // a new object is assigned on each run, so that running the same code twice reloads the result
  const runCode = ref<PlaygroundCode | null>(null);

  function updateCode(code: PlaygroundCode) {
    currentExample.value = undefined;
    editorCode.value = withDefaults(code);
  }

  async function run() {
    const js = await formatJs(editorCode.value.js);
    editorCode.value = { ...editorCode.value, js };
    runCode.value = { ...editorCode.value };
  }

  async function loadExample(example: PlaygroundCode) {
    currentExample.value = example;
    editorCode.value = withDefaults(example);
    await run();
  }

  async function getShareUrl(): Promise<string> {
    const url = new URL(window.location.href);
    url.hash = btoa(await formatJsCompact(editorCode.value.js));
    return url.toString();
  }

  return {
    editorCode: readonly(editorCode),
    currentExample: readonly(currentExample),
    runCode: readonly(runCode),
    updateCode,
    loadExample,
    run,
    getShareUrl,
  };
}
