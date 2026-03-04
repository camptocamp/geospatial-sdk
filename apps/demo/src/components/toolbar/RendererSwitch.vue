<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapContextStore } from '@/stores/mapContext'
import { useMapRendererStore } from '@/stores/mapRenderer'
import type { RendererType } from '@/types'

const mapTarget = defineModel<HTMLElement | null>('mapTarget')
const contextStore = useMapContextStore()
const rendererStore = useMapRendererStore()
const { renderer } = storeToRefs(rendererStore)

const items = [
  { label: 'OpenLayers', value: 'openlayers' as RendererType },
  { label: 'MapLibre', value: 'maplibre' as RendererType },
]

const selected = computed(() => renderer.value)

async function onSwitch(value: string) {
  if (value === renderer.value || !mapTarget.value) return
  await rendererStore.switchRenderer(
    value as RendererType,
    contextStore.context,
    mapTarget.value,
  )
}
</script>

<template>
  <div class="flex gap-3">
    <UButton
      v-for="item in items"
      :key="item.value"
      :label="item.label"
      :variant="selected === item.value ? 'solid' : 'outline'"
      size="sm"
      @click="onSwitch(item.value)"
    />
  </div>
</template>
