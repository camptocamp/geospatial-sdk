<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapContextStore } from '@/stores/mapContext'
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { EditorView } from 'codemirror'

const contextStore = useMapContextStore()
const { context } = storeToRefs(contextStore)
const open = ref(false)

const editedJson = ref('')
const jsonError = ref('')

const storeJson = computed(() => JSON.stringify(context.value, null, 2))
const isModified = computed(() => editedJson.value !== storeJson.value)
const canApply = computed(() => isModified.value && !jsonError.value)

const extensions = [json(), EditorView.lineWrapping]

// Sync editor content when store changes (and editor is not dirty)
watch(
  storeJson,
  (val) => {
    if (!isModified.value) {
      editedJson.value = val
    }
  },
  { immediate: true },
)

// Reset editor when panel opens
watch(open, (val) => {
  if (val) {
    editedJson.value = storeJson.value
    jsonError.value = ''
  }
})

function validate(json: string): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (e) {
    return (e as Error).message
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return 'Context must be an object'
  }
  const obj = parsed as Record<string, unknown>
  if (!Array.isArray(obj.layers)) {
    return 'Missing or invalid "layers" property (must be an array)'
  }
  if (!obj.view || typeof obj.view !== 'object') {
    return 'Missing or invalid "view" property (must be an object)'
  }
  return ''
}

function onUpdate(value: string) {
  editedJson.value = value
  jsonError.value = validate(value)
}

function apply() {
  if (!canApply.value) return
  const error = validate(editedJson.value)
  if (error) {
    jsonError.value = error
    return
  }
  contextStore.setContext(JSON.parse(editedJson.value))
  jsonError.value = ''
}

function reset() {
  editedJson.value = storeJson.value
  jsonError.value = ''
}
</script>

<template>
  <!-- Toggle button -->
  <button
    class="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50"
    @click="open = !open"
  >
    <UIcon name="i-lucide-braces" />
    <span>Context</span>
  </button>

  <!-- Full-height overlay panel -->
  <div
    v-if="open"
    class="absolute inset-y-0 right-0 z-10 flex w-[28rem] flex-col border-l border-gray-200 bg-white shadow-lg"
  >
    <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2">
      <span class="text-sm font-medium">MapContext JSON</span>
      <div class="flex items-center gap-1">
        <UButton
          v-if="isModified"
          label="Reset"
          title="Discard changes"
          variant="ghost"
          size="xs"
          @click="reset"
        />
        <UButton
          label="Apply"
          title="Apply changes to map"
          size="xs"
          :disabled="!canApply"
          @click="apply"
        />
        <button
          class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Close panel"
          @click="open = false"
        >
          <UIcon name="i-lucide-x" />
        </button>
      </div>
    </div>
    <div v-if="jsonError" class="border-b border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600">
      {{ jsonError }}
    </div>
    <Codemirror
      :model-value="editedJson"
      :extensions="extensions"
      :style="{ flex: 1, overflow: 'auto' }"
      @update:model-value="onUpdate"
    />
  </div>
</template>
