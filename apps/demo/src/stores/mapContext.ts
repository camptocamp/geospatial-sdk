import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MapContext, MapContextLayer } from '@geospatial-sdk/core'

export const useMapContextStore = defineStore('mapContext', () => {
  const context = ref<MapContext>({
    layers: [
      {
        type: 'xyz',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        label: 'OpenStreetMap',
      },
    ],
    view: {
      center: [7.75, 48.6],
      zoom: 5,
    },
  })

  function addLayer(layer: MapContextLayer) {
    context.value = {
      ...context.value,
      layers: [...context.value.layers, layer],
    }
  }

  function removeLayer(index: number) {
    const layers = [...context.value.layers]
    layers.splice(index, 1)
    context.value = { ...context.value, layers }
  }

  function updateLayer(index: number, updates: Partial<MapContextLayer>) {
    const layers = [...context.value.layers]
    const existing = layers[index]
    if (!existing) return
    layers[index] = { ...existing, ...updates } as MapContextLayer
    context.value = { ...context.value, layers }
  }

  function moveLayer(fromIndex: number, toIndex: number) {
    const layers = [...context.value.layers]
    const [moved] = layers.splice(fromIndex, 1)
    if (!moved) return
    layers.splice(toIndex, 0, moved)
    context.value = { ...context.value, layers }
  }

  function setContext(newContext: MapContext) {
    context.value = newContext
  }

  return { context, addLayer, removeLayer, updateLayer, moveLayer, setContext }
})
