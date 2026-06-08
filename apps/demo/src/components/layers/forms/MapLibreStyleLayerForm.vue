<script setup lang="ts">
import { ref } from 'vue'
import type { MapContextLayerMapLibreStyle } from '@geospatial-sdk/core'
import type { RendererType } from '@/types'
import { getPresetsForType } from '@/presets/layer-presets'

defineProps<{ renderer: RendererType }>()
const emit = defineEmits<{ add: [layer: MapContextLayerMapLibreStyle] }>()

const presets = getPresetsForType('maplibre-style')
const defaultPreset = presets[0]?.layer as MapContextLayerMapLibreStyle | undefined
const presetBase = ref<MapContextLayerMapLibreStyle | undefined>(defaultPreset)
const styleUrl = ref(defaultPreset?.styleUrl ?? '')
const accessToken = ref(defaultPreset?.accessToken ?? '')
const label = ref(defaultPreset?.label ?? '')

function usePreset(preset: (typeof presets)[0]) {
  const l = preset.layer as MapContextLayerMapLibreStyle
  presetBase.value = l
  styleUrl.value = l.styleUrl
  accessToken.value = l.accessToken ?? ''
  label.value = l.label ?? ''
}

function add() {
  if (!styleUrl.value) return
  emit('add', {
    ...presetBase.value,
    type: 'maplibre-style',
    styleUrl: styleUrl.value,
    ...(accessToken.value ? { accessToken: accessToken.value } : {}),
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
    <UFormField label="Style URL">
      <UInput v-model="styleUrl" placeholder="MapLibre style.json URL" class="w-full" />
    </UFormField>
    <UFormField label="Access Token (optional)">
      <UInput v-model="accessToken" placeholder="Access token" class="w-full" />
    </UFormField>
    <UFormField label="Label (optional)">
      <UInput v-model="label" placeholder="Display label" class="w-full" />
    </UFormField>
    <UButton label="Add Layer" @click="add" :disabled="!styleUrl" />
  </div>
</template>
