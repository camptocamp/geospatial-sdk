<script setup lang="ts">
import { ref } from 'vue'
import type { MapContextLayerGeojson } from '@geospatial-sdk/core'
import type { RendererType } from '@/types'
import { getPresetsForType } from '@/presets/layer-presets'

defineProps<{ renderer: RendererType }>()
const emit = defineEmits<{ add: [layer: MapContextLayerGeojson] }>()

const presets = getPresetsForType('geojson')
const defaultPreset = presets[0]?.layer as MapContextLayerGeojson | undefined
const presetBase = ref<MapContextLayerGeojson | undefined>(defaultPreset)
const hasDefaultUrl = defaultPreset && 'url' in defaultPreset && defaultPreset.url
const url = ref(hasDefaultUrl ? defaultPreset.url : '')
const data = ref(
  !hasDefaultUrl && defaultPreset && 'data' in defaultPreset && defaultPreset.data
    ? JSON.stringify(defaultPreset.data, null, 2)
    : '',
)
const label = ref(defaultPreset?.label ?? '')
const useUrl = ref(!!hasDefaultUrl)

function usePreset(preset: (typeof presets)[0]) {
  const l = preset.layer as MapContextLayerGeojson
  presetBase.value = l
  if ('url' in l && l.url) {
    useUrl.value = true
    url.value = l.url
    data.value = ''
  } else if ('data' in l && l.data) {
    useUrl.value = false
    data.value = typeof l.data === 'string' ? l.data : JSON.stringify(l.data, null, 2)
    url.value = ''
  }
  label.value = l.label ?? ''
}

function add() {
  if (useUrl.value) {
    if (!url.value) return
    emit('add', {
      ...presetBase.value,
      type: 'geojson',
      url: url.value,
      ...(label.value ? { label: label.value } : {}),
    })
  } else {
    if (!data.value) return
    try {
      const parsed = JSON.parse(data.value)
      emit('add', {
        ...presetBase.value,
        type: 'geojson',
        data: parsed,
        ...(label.value ? { label: label.value } : {}),
      })
    } catch {
      // invalid JSON
    }
  }
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
    <div class="flex items-center gap-4">
      <label class="flex items-center gap-1 text-sm">
        <input type="radio" :value="true" v-model="useUrl" />
        URL
      </label>
      <label class="flex items-center gap-1 text-sm">
        <input type="radio" :value="false" v-model="useUrl" />
        Inline Data
      </label>
    </div>
    <UFormField v-if="useUrl" label="URL">
      <UInput v-model="url" placeholder="GeoJSON URL" class="w-full" />
    </UFormField>
    <UFormField v-else label="GeoJSON Data">
      <UTextarea
        v-model="data"
        placeholder='{ "type": "FeatureCollection", "features": [...] }'
        :rows="6"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Label (optional)">
      <UInput v-model="label" placeholder="Display label" class="w-full" />
    </UFormField>
    <UButton label="Add Layer" @click="add" :disabled="useUrl ? !url : !data" />
  </div>
</template>
