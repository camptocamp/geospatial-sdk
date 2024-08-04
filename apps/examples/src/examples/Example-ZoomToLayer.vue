<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Map from 'ol/Map'
import { applyContextDiffToMap, createMapFromContext } from '@geospatial-sdk/openlayers'
import {
  computeMapContextDiff,
  createViewFromLayer,
  type MapContext,
  type MapContextLayerGeojson,
  type MapContextLayerWms,
  type MapContextLayerWmts
} from '@geospatial-sdk/core'
import ButtonSimple from '@/components/ButtonSimple.vue'
import { DEFAULT_CONTEXT, GERMANY_GEOJSON } from '@/constants'

const Layers = {
  wms: {
    type: 'wms',
    url: 'https://data.geopf.fr/wms-r/wms',
    name: 'CADASTRALPARCELS.HEATMAP'
  } as MapContextLayerWms,
  wmts: {
    type: 'wmts',
    url: 'https://map.bern.ch/arcgis/rest/services/Geoportal/Hist_Bern_1872/MapServer/WMTS/1.0.0/WMTSCapabilities.xml',
    name: 'Geoportal_Hist_Bern_1872'
  } as MapContextLayerWmts,
  geojson: {
    type: 'geojson',
    data: GERMANY_GEOJSON
  } as MapContextLayerGeojson
}

const mapRoot = ref<HTMLElement>()
let map: Map
let context = {
  ...DEFAULT_CONTEXT,
  layers: [...DEFAULT_CONTEXT.layers, Layers.wms, Layers.geojson, Layers.wmts]
}

onMounted(async () => {
  map = await createMapFromContext(context, mapRoot.value)
})

async function zoomTo(layer: 'wms' | 'geojson' | 'wmts') {
  const newView = await createViewFromLayer(Layers[layer])
  if (newView === null) {
    return
  }
  let newContext: MapContext = { ...context, view: newView }
  await applyContextDiffToMap(map, computeMapContextDiff(newContext, context))
  context = newContext
}
</script>

<template>
  <div ref="mapRoot" class="w-full h-full relative">
    <div class="absolute inset-x-4 bottom-4 flex flex-row gap-4 z-50">
      <ButtonSimple class="shadow-sm" @click="zoomTo('geojson')">
        Zoom to GeoJSON layer
      </ButtonSimple>
      <ButtonSimple class="shadow-sm" @click="zoomTo('wmts')">Zoom to WMTS layer</ButtonSimple>
      <ButtonSimple class="shadow-sm" @click="zoomTo('wms')">Zoom to WMS layer</ButtonSimple>
    </div>
  </div>
</template>
