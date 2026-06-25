<script setup lang="ts">
import { ref } from 'vue'
import type { MapContextLayerXyz } from '@geospatial-sdk/core'
import type { RendererType } from '@/types'
import { getPresetsForType } from '@/presets/layer-presets'

defineProps<{ renderer: RendererType }>()
const emit = defineEmits<{ add: [layer: MapContextLayerXyz] }>()

const presets = getPresetsForType('xyz')
const defaultPreset = presets[0]?.layer as MapContextLayerXyz | undefined
const presetBase = ref<MapContextLayerXyz | undefined>(defaultPreset)
const url = ref(defaultPreset?.url ?? '')
const label = ref(defaultPreset?.label ?? '')
const isMvt = ref(defaultPreset?.tileFormat === 'application/vnd.mapbox-vector-tile')

function usePreset(preset: (typeof presets)[0]) {
  const l = preset.layer as MapContextLayerXyz
  presetBase.value = l
  url.value = l.url
  label.value = l.label ?? ''
  isMvt.value = l.tileFormat === 'application/vnd.mapbox-vector-tile'
}

function add() {
  if (!url.value) return
  emit('add', {
    ...presetBase.value,
    type: 'xyz',
    url: url.value,
    ...(label.value ? { label: label.value } : {}),
    ...(isMvt.value
      ? {
          tileFormat: 'application/vnd.mapbox-vector-tile' as const,
        }
      : {}),
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
      <UInput v-model="url" placeholder="https://tile.example.com/{z}/{x}/{y}.png" class="w-full" />
    </UFormField>
    <UFormField label="Label (optional)">
      <UInput v-model="label" placeholder="Display label" class="w-full" />
    </UFormField>
    <div class="flex items-center gap-2">
      <USwitch v-model="isMvt" />
      <span class="text-sm">MapBox Vector Tiles (MVT)</span>
    </div>
    <UButton label="Add Layer" @click="add" :disabled="!url" />
  </div>
</template>
