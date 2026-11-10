<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Map from 'ol/Map'
import { applyContextDiffToMap, createMapFromContext } from '@geospatial-sdk/openlayers'
import {
  addLayerToContext,
  computeMapContextDiff,
  getLayerPositionInContext,
  type MapContextLayer,
  removeLayerFromContext
} from '@geospatial-sdk/core'
import ButtonSimple from '@/components/ButtonSimple.vue'
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

function isLayerEnabled(layer: 'wms1' | 'wms2' | 'xyz') {
  return getLayerPositionInContext(context, Layers[layer]) >= 0
}

const mapRoot = ref<HTMLElement>()
let map: Map
let context = DEFAULT_CONTEXT

onMounted(async () => {
  map = await createMapFromContext(context, mapRoot.value)
})

async function toggleLayer(layer: 'wms1' | 'wms2' | 'xyz') {
  const enabled = getLayerPositionInContext(context, Layers[layer]) >= 0
  let newContext
  if (!enabled) {
    newContext = addLayerToContext(context, Layers[layer])
  } else {
    newContext = removeLayerFromContext(context, Layers[layer])
  }
  await applyContextDiffToMap(map, computeMapContextDiff(newContext, context))
  context = newContext
}
</script>

<template>
  <div ref="mapRoot" class="w-full h-full relative">
    <div class="absolute inset-x-4 bottom-4 flex flex-row gap-4 z-50">
      <ButtonSimple class="shadow-sm" @click="toggleLayer('wms1')">
        {{ isLayerEnabled('wms1') ? 'Remove' : 'Add' }} layer over France
      </ButtonSimple>
      <ButtonSimple class="shadow-sm" @click="toggleLayer('wms2')">
        {{ isLayerEnabled('wms2') ? 'Remove' : 'Add' }} layer over Germany
      </ButtonSimple>
      <ButtonSimple class="shadow-sm" @click="toggleLayer('xyz')">
        {{ isLayerEnabled('xyz') ? 'Remove' : 'Add' }} satellite layer
      </ButtonSimple>
    </div>
  </div>
</template>
