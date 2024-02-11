<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Map from 'ol/Map'
import { applyContextDiffToMap, createMapFromContext } from '@geospatial-sdk/openlayers'
import { computeMapContextDiff, getLayerPosition, type MapContextLayer } from '@geospatial-sdk/core'
import Button from '@/components/Button.vue'
import { DEFAULT_CONTEXT } from '@/constants'

const Layers: Record<string, MapContextLayer> = {
  wms1: {
    type: 'wms',
    url: 'https://data.geopf.fr/wms-r/wms',
    name: 'INSEE.FILOSOFI.POPULATION'
  },
  wms2: {
    type: 'wms',
    url: 'https://www.geoportal.de/openurl/https/services.bgr.de/wms/boden/gmk1000r/',
    name: '0'
  },
  xyz: {
    type: 'xyz',
    url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=get_your_own_D6rA4zTHduk6KOKTXzGB'
  }
}

const mapRoot = ref<HTMLElement>()
let map: Map
let context = DEFAULT_CONTEXT
let layerStates = ref({
  wms1: false,
  wms2: false,
  xyz: false
})

onMounted(() => {
  map = createMapFromContext(context, mapRoot.value)
})

function toggleLayer(layer: 'wms1' | 'wms2' | 'xyz') {
  let newContext = { ...context, layers: [...context.layers] }
  const enabled = layerStates.value[layer]
  if (!enabled) {
    newContext.layers.push(Layers[layer])
  } else {
    const layerPos = getLayerPosition(context, Layers[layer])
    newContext.layers.splice(layerPos, 1)
  }
  applyContextDiffToMap(map, computeMapContextDiff(newContext, context))
  layerStates.value[layer] = !enabled
  context = newContext
}
</script>

<template>
  <div ref="mapRoot" class="w-full h-full relative">
    <div class="absolute inset-x-4 bottom-4 flex flex-row gap-4 z-50">
      <Button class="shadow-sm" @click="toggleLayer('wms1')">
        {{ layerStates['wms1'] ? 'Remove' : 'Add' }} layer over France
      </Button>
      <Button class="shadow-sm" @click="toggleLayer('wms2')">
        {{ layerStates['wms2'] ? 'Remove' : 'Add' }} layer over Germany
      </Button>
      <Button class="shadow-sm" @click="toggleLayer('xyz')">
        {{ layerStates['xyz'] ? 'Remove' : 'Add' }} satellite layer
      </Button>
    </div>
  </div>
</template>
