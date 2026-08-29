<script setup lang="ts">
import { ref } from 'vue'
import type { MapContextLayerOgcApi } from '@geospatial-sdk/core'
import type { RendererType } from '@/types'
import { getPresetsForType } from '@/presets/layer-presets'

defineProps<{ renderer: RendererType }>()
const emit = defineEmits<{ add: [layer: MapContextLayerOgcApi] }>()

const presets = getPresetsForType('ogcapi')
const defaultPreset = presets[0]?.layer as MapContextLayerOgcApi | undefined
const presetBase = ref<MapContextLayerOgcApi | undefined>(defaultPreset)
const url = ref(defaultPreset?.url ?? '')
const collection = ref(defaultPreset?.collection ?? '')
const label = ref(defaultPreset?.label ?? '')

function usePreset(preset: (typeof presets)[0]) {
  const l = preset.layer as MapContextLayerOgcApi
  presetBase.value = l
  url.value = l.url
  collection.value = l.collection
  label.value = l.label ?? ''
}

function add() {
  if (!url.value || !collection.value) return
  emit('add', {
    ...presetBase.value,
    type: 'ogcapi',
    url: url.value,
    collection: collection.value,
    ...(label.value ? { label: label.value } : {}),
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="preset in presets"
        :key="preset.presetLabel"
        :label="preset.presetLabel"
        variant="soft"
        size="xs"
        @click="usePreset(preset)"
      />
    </div>
    <UFormField label="URL">
      <UInput v-model="url" placeholder="OGC API items URL" class="w-full" />
    </UFormField>
    <UFormField label="Collection">
      <UInput v-model="collection" placeholder="Collection name" class="w-full" />
    </UFormField>
    <UFormField label="Label (optional)">
      <UInput v-model="label" placeholder="Display label" class="w-full" />
    </UFormField>
    <UButton label="Add Layer" @click="add" :disabled="!url || !collection" />
  </div>
</template>
