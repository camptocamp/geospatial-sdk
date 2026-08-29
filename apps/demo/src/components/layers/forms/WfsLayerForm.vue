<script setup lang="ts">
import { ref } from 'vue'
import type { MapContextLayerWfs } from '@geospatial-sdk/core'
import type { RendererType } from '@/types'
import { getPresetsForType } from '@/presets/layer-presets'

defineProps<{ renderer: RendererType }>()
const emit = defineEmits<{ add: [layer: MapContextLayerWfs] }>()

const presets = getPresetsForType('wfs')
const defaultPreset = presets[0]?.layer as MapContextLayerWfs | undefined
const presetBase = ref<MapContextLayerWfs | undefined>(defaultPreset)
const url = ref(defaultPreset?.url ?? '')
const featureType = ref(defaultPreset?.featureType ?? '')
const label = ref(defaultPreset?.label ?? '')

function usePreset(preset: (typeof presets)[0]) {
  const l = preset.layer as MapContextLayerWfs
  presetBase.value = l
  url.value = l.url
  featureType.value = l.featureType
  label.value = l.label ?? ''
}

function add() {
  if (!url.value || !featureType.value) return
  emit('add', {
    ...presetBase.value,
    type: 'wfs',
    url: url.value,
    featureType: featureType.value,
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
      <UInput v-model="url" placeholder="WFS GetCapabilities URL" class="w-full" />
    </UFormField>
    <UFormField label="Feature Type">
      <UInput v-model="featureType" placeholder="Feature type name" class="w-full" />
    </UFormField>
    <UFormField label="Label (optional)">
      <UInput v-model="label" placeholder="Display label" class="w-full" />
    </UFormField>
    <UButton label="Add Layer" @click="add" :disabled="!url || !featureType" />
  </div>
</template>
