<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MapContextLayer } from '@geospatial-sdk/core'
import { useMapContextStore } from '@/stores/mapContext'

const props = defineProps<{
  layer: MapContextLayer
  index: number
}>()

const emit = defineEmits<{
  remove: [index: number]
  'update:visibility': [index: number, visible: boolean]
  'update:opacity': [index: number, opacity: number]
  'move-up': [index: number]
  'move-down': [index: number]
}>()

const contextStore = useMapContextStore()
const isZooming = ref(false)

const label = computed(() => props.layer.label || `${props.layer.type} layer`)
const isVisible = computed(() => props.layer.visibility !== false)
const localOpacity = ref(Math.round((props.layer.opacity ?? 1) * 100))

watch(
  () => props.layer.opacity,
  (v) => {
    localOpacity.value = Math.round((v ?? 1) * 100)
  },
)

let opacityTimer: ReturnType<typeof setTimeout> | undefined
function debouncedEmitOpacity(index: number, opacity: number) {
  clearTimeout(opacityTimer)
  opacityTimer = setTimeout(() => emit('update:opacity', index, opacity), 300)
}

function onOpacityInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  localOpacity.value = value
  debouncedEmitOpacity(props.index, value / 100)
}

const canZoomToExtent = computed(() => {
  const t = props.layer.type
  if (t === 'wms' || t === 'wmts' || t === 'wfs' || t === 'geotiff') return true
  if (t === 'geojson' && 'data' in props.layer && props.layer.data) return true
  return false
})

async function zoomToLayer() {
  isZooming.value = true
  try {
    const { createViewFromLayer } = await import('@geospatial-sdk/core')
    const view = await createViewFromLayer(props.layer)
    if (view) {
      contextStore.setContext({
        ...contextStore.context,
        view,
      })
    }
  } catch (e) {
    console.warn('[zoom] Failed to get layer extent:', e)
  } finally {
    isZooming.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
    <UButton
      :icon="isVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
      :title="isVisible ? 'Hide layer' : 'Show layer'"
      variant="ghost"
      size="xs"
      @click="emit('update:visibility', index, !isVisible)"
    />

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1">
        <UBadge :label="layer.type" variant="subtle" size="sm" />
        <span class="truncate text-sm">{{ label }}</span>
      </div>
      <div class="mt-1 flex items-center gap-2">
        <span class="text-xs text-gray-500">{{ localOpacity }}%</span>
        <input
          type="range"
          :value="localOpacity"
          min="0"
          max="100"
          class="h-1 flex-1 cursor-pointer accent-gray-600"
          @input="onOpacityInput"
        />
      </div>
    </div>

    <UButton
      v-if="canZoomToExtent"
      icon="i-lucide-locate"
      title="Zoom to layer extent"
      variant="ghost"
      size="xs"
      :loading="isZooming"
      @click="zoomToLayer"
    />

    <div class="flex flex-col gap-0.5">
      <UButton
        icon="i-lucide-chevron-up"
        title="Move layer up"
        variant="ghost"
        size="xs"
        @click="emit('move-up', index)"
      />
      <UButton
        icon="i-lucide-chevron-down"
        title="Move layer down"
        variant="ghost"
        size="xs"
        @click="emit('move-down', index)"
      />
    </div>

    <UButton
      icon="i-lucide-trash-2"
      title="Remove layer"
      variant="ghost"
      color="red"
      size="xs"
      @click="emit('remove', index)"
    />
  </div>
</template>
