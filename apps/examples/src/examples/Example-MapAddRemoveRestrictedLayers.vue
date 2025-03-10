<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Map from 'ol/Map'
import { applyContextDiffToMap, createMapFromContext, listen } from '@geospatial-sdk/openlayers'
import { computeMapContextDiff, getLayerPosition, type MapContextLayer } from '@geospatial-sdk/core'
import ButtonSimple from '@/components/ButtonSimple.vue'
import Panel from '@/components/Panel.vue'
import { DEFAULT_CONTEXT } from '@/constants'

const Layers: Record<string, MapContextLayer> = {
  wms1: {
    type: 'wms',
    url: 'https://data.geopf.fr/private/wms-r',
    name: 'INSEE.FILOSOFI.POPULATION'
  },
  wmts: {
    type: 'wmts',
    url: 'https://data.geopf.fr/private/wmts',
    name: '0'
  },
  xyz: {
    type: 'xyz',
    url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg'
  }
}

const mapRoot = ref<HTMLElement>()
let map: Map
let context = DEFAULT_CONTEXT
let layerStates = ref({
  wms1: false,
  wmts: false,
  xyz: false
})
let errorCode = ref<number | null>(null)

onMounted(async () => {
  map = await createMapFromContext(context, mapRoot.value)
  listen(map, 'source-load-error', (event) => (errorCode.value = event.statusCode))
})

async function toggleLayer(layer: 'wms1' | 'wmts' | 'xyz') {
  let newContext = { ...context, layers: [...context.layers] }
  const enabled = layerStates.value[layer]
  if (!enabled) {
    newContext.layers.push(Layers[layer])
  } else {
    const layerPos = getLayerPosition(context, Layers[layer])
    newContext.layers.splice(layerPos, 1)
  }
  await applyContextDiffToMap(map, computeMapContextDiff(newContext, context))
  layerStates.value[layer] = !enabled
  context = newContext
}
</script>

<template>
  <div ref="mapRoot" class="w-full h-full relative">
    <div class="absolute top-3 right-3 flex flex-col gap-3 z-50 w-56">
      <Panel v-if="errorCode">
        <strong>The source responded with error code: </strong>
        {{ errorCode }}
      </Panel>
    </div>
    <div class="absolute inset-x-4 bottom-4 flex flex-row gap-4 z-50">
      <ButtonSimple class="shadow-sm" @click="toggleLayer('wms1')">
        {{ layerStates['wms1'] ? 'Remove' : 'Add' }} restricted WMS
      </ButtonSimple>
      <ButtonSimple class="shadow-sm" @click="toggleLayer('wmts')">
        {{ layerStates['wmts'] ? 'Remove' : 'Add' }} restricted WMTS
      </ButtonSimple>
      <ButtonSimple class="shadow-sm" @click="toggleLayer('xyz')">
        {{ layerStates['xyz'] ? 'Remove' : 'Add' }} restricted XYZ
      </ButtonSimple>
    </div>
  </div>
</template>
