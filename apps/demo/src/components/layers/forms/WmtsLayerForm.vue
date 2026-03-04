<script setup lang="ts">
import { ref } from 'vue'
import type { MapContextLayerWmts } from '@geospatial-sdk/core'
import type { RendererType } from '@/types'
import { getPresetsForType } from '@/presets/layer-presets'

defineProps<{ renderer: RendererType }>()
const emit = defineEmits<{ add: [layer: MapContextLayerWmts] }>()

const presets = getPresetsForType('wmts')
const defaultPreset = presets[0]?.layer as MapContextLayerWmts | undefined
const presetBase = ref<MapContextLayerWmts | undefined>(defaultPreset)
const url = ref(defaultPreset?.url ?? '')
const name = ref(defaultPreset?.name ?? '')
const label = ref(defaultPreset?.label ?? '')

function usePreset(preset: (typeof presets)[0]) {
  const l = preset.layer as MapContextLayerWmts
  presetBase.value = l
  url.value = l.url
  name.value = l.name
  label.value = l.label ?? ''
}

function add() {
  if (!url.value || !name.value) return
  emit('add', {
    ...presetBase.value,
    type: 'wmts',
    url: url.value,
    name: name.value,
    ...(label.value ? { label: label.value } : {}),
  })
}
</script>

<template>
  <div class="space-y-4">
    <UBadge v-if="renderer === 'maplibre'" color="amber" variant="subtle">
      WMTS is not supported by the MapLibre renderer
    </UBadge>
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
      <UInput v-model="url" placeholder="WMTS GetCapabilities URL" class="w-full" />
    </UFormField>
    <UFormField label="Layer Name">
      <UInput v-model="name" placeholder="Layer name" class="w-full" />
    </UFormField>
    <UFormField label="Label (optional)">
      <UInput v-model="label" placeholder="Display label" class="w-full" />
    </UFormField>
    <UButton label="Add Layer" @click="add" :disabled="!url || !name" />
  </div>
</template>
