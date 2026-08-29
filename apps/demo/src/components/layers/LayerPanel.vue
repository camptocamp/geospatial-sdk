<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapContextStore } from '@/stores/mapContext'
import { useMapRendererStore } from '@/stores/mapRenderer'
import { layerTypes } from '@/presets/layer-presets'
import type { MapContextLayer } from '@geospatial-sdk/core'
import LayerList from './LayerList.vue'
import WmsLayerForm from './forms/WmsLayerForm.vue'
import WmtsLayerForm from './forms/WmtsLayerForm.vue'
import WfsLayerForm from './forms/WfsLayerForm.vue'
import XyzLayerForm from './forms/XyzLayerForm.vue'
import GeojsonLayerForm from './forms/GeojsonLayerForm.vue'
import OgcApiLayerForm from './forms/OgcApiLayerForm.vue'
import MapLibreStyleLayerForm from './forms/MapLibreStyleLayerForm.vue'
import GeotiffLayerForm from './forms/GeotiffLayerForm.vue'

const dialogOpen = ref(false)
const activeTab = ref('wms')
const contextStore = useMapContextStore()
const rendererStore = useMapRendererStore()
const { renderer } = storeToRefs(rendererStore)

const tabs = layerTypes.map((lt) => ({
  label: lt.label,
  value: lt.type,
}))

function onAdd(layer: MapContextLayer) {
  contextStore.addLayer(layer)
  dialogOpen.value = false
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2">
      <span class="text-sm font-medium">Layers</span>
      <UButton icon="i-lucide-plus" label="Add Layer" size="xs" @click="dialogOpen = true" />
    </div>
    <div class="flex-1 overflow-y-auto">
      <LayerList />
    </div>

    <!-- Overlay -->
    <Teleport to="body">
      <div
        v-if="dialogOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="dialogOpen = false"
      >
        <div
          class="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        >
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Add Layer</h2>
            <UButton icon="i-lucide-x" variant="ghost" size="xs" @click="dialogOpen = false" />
          </div>
          <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #content="{ item }">
              <div class="py-4">
                <WmsLayerForm v-if="item.value === 'wms'" :renderer="renderer" @add="onAdd" />
                <WmtsLayerForm
                  v-else-if="item.value === 'wmts'"
                  :renderer="renderer"
                  @add="onAdd"
                />
                <WfsLayerForm v-else-if="item.value === 'wfs'" :renderer="renderer" @add="onAdd" />
                <XyzLayerForm v-else-if="item.value === 'xyz'" :renderer="renderer" @add="onAdd" />
                <GeojsonLayerForm
                  v-else-if="item.value === 'geojson'"
                  :renderer="renderer"
                  @add="onAdd"
                />
                <OgcApiLayerForm
                  v-else-if="item.value === 'ogcapi'"
                  :renderer="renderer"
                  @add="onAdd"
                />
                <MapLibreStyleLayerForm
                  v-else-if="item.value === 'maplibre-style'"
                  :renderer="renderer"
                  @add="onAdd"
                />
                <GeotiffLayerForm
                  v-else-if="item.value === 'geotiff'"
                  :renderer="renderer"
                  @add="onAdd"
                />
              </div>
            </template>
          </UTabs>
        </div>
      </div>
    </Teleport>
  </div>
</template>
