<script setup lang="ts">
import { ref } from 'vue'
import type { MapContextLayerGeotiff } from '@geospatial-sdk/core'
import type { RendererType } from '@/types'
import { getPresetsForType } from '@/presets/layer-presets'

defineProps<{ renderer: RendererType }>()
const emit = defineEmits<{ add: [layer: MapContextLayerGeotiff] }>()

const presets = getPresetsForType('geotiff')
const defaultPreset = presets[0]?.layer as MapContextLayerGeotiff | undefined
const presetBase = ref<MapContextLayerGeotiff | undefined>(defaultPreset)
const url = ref(defaultPreset?.url ?? '')
const label = ref(defaultPreset?.label ?? '')

function usePreset(preset: (typeof presets)[0]) {
  const l = preset.layer as MapContextLayerGeotiff
  presetBase.value = l
  url.value = l.url
  label.value = l.label ?? ''
}

function add() {
  if (!url.value) return
  emit('add', {
    ...presetBase.value,
    type: 'geotiff',
    url: url.value,
    ...(label.value ? { label: label.value } : {}),
  })
}
</script>

<template>
  <div class="space-y-4">
    <UBadge v-if="renderer === 'maplibre'" color="amber" variant="subtle">
      GeoTIFF is not supported by the MapLibre renderer
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
      <UInput v-model="url" placeholder="GeoTIFF / COG URL" class="w-full" />
    </UFormField>
    <UFormField label="Label (optional)">
      <UInput v-model="label" placeholder="Display label" class="w-full" />
    </UFormField>
    <UButton label="Add Layer" @click="add" :disabled="!url" />
  </div>
</template>
