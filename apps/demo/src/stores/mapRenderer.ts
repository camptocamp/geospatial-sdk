import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { MapContext } from '@geospatial-sdk/core'
import { computeMapContextDiff } from '@geospatial-sdk/core'
import type { RendererType } from '@/types'

export const useMapRendererStore = defineStore('mapRenderer', () => {
  const renderer = ref<RendererType>('openlayers')
  const mapInstance = shallowRef<any>(null)
  const isLoading = ref(false)

  async function createMap(context: MapContext, target: HTMLElement): Promise<void> {
    isLoading.value = true
    try {
      if (renderer.value === 'openlayers') {
        const { createMapFromContext } = await import('@geospatial-sdk/openlayers')
        mapInstance.value = await createMapFromContext(context, target)
      } else {
        const { createMapFromContext } = await import('@geospatial-sdk/maplibre')
        mapInstance.value = await createMapFromContext(context, {
          container: target,
        })
      }
    } catch (e) {
      console.warn(`[renderer] Error creating map with ${renderer.value}:`, e)
    } finally {
      isLoading.value = false
    }
  }

  async function applyDiff(newContext: MapContext, oldContext: MapContext): Promise<void> {
    if (!mapInstance.value) return
    const diff = computeMapContextDiff(newContext, oldContext)
    try {
      if (renderer.value === 'openlayers') {
        const { applyContextDiffToMap } = await import('@geospatial-sdk/openlayers')
        mapInstance.value = await applyContextDiffToMap(mapInstance.value, diff)
      } else {
        const { applyContextDiffToMap } = await import('@geospatial-sdk/maplibre')
        mapInstance.value = await applyContextDiffToMap(mapInstance.value, diff)
      }
    } catch (e) {
      console.warn(`[renderer] Error applying diff with ${renderer.value}:`, e)
    }
  }

  function destroyMap() {
    if (!mapInstance.value) return
    if (renderer.value === 'openlayers') {
      mapInstance.value.setTarget(undefined)
      mapInstance.value.dispose()
    } else {
      mapInstance.value.remove()
    }
    mapInstance.value = null
  }

  async function switchRenderer(
    newRenderer: RendererType,
    context: MapContext,
    target: HTMLElement,
  ): Promise<void> {
    destroyMap()
    renderer.value = newRenderer
    await createMap(context, target)
  }

  return { renderer, mapInstance, isLoading, createMap, applyDiff, destroyMap, switchRenderer }
})
