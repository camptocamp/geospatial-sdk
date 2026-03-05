<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { applyContextDiffToMap, createMapFromContext } from '@geospatial-sdk/openlayers'
import { computeMapContextDiff, createViewFromLayer, updateLayerInContext, type MapContextLayerWms } from '@geospatial-sdk/core'
import { createLegendFromLayer } from '@geospatial-sdk/legend'
import { WmsEndpoint } from '@camptocamp/ogc-client'
import ButtonSimple from '@/components/ButtonSimple.vue'
import { DEFAULT_CONTEXT } from '@/constants'

const wmsLayer: MapContextLayerWms = {
  type: 'wms',
  url: 'https://qgisserver.hautsdefrance.fr/cgi-bin/qgis_mapserv.fcgi?MAP=/var/www/data/qgis/applications/limites_admin.qgz',
  name: 'scot_en_cours'
}

const mapRoot = ref<HTMLElement>()
const legendRoot = ref<HTMLElement>()
const styles = ref<string[]>([])
const currentStyle = ref('')
let map: any
let context = {
  ...DEFAULT_CONTEXT,
  layers: [...DEFAULT_CONTEXT.layers, wmsLayer]
}

async function showLegend(layer: MapContextLayerWms) {
  legendRoot.value!.innerHTML = ''
  const el = await createLegendFromLayer(layer)
  if (el) legendRoot.value!.appendChild(el)
}

async function switchStyle(style: string) {
  const newContext = updateLayerInContext(context, context.layers[1], { style })
  await applyContextDiffToMap(map, computeMapContextDiff(newContext, context))
  context = newContext
  currentStyle.value = style
  await showLegend(newContext.layers[1] as MapContextLayerWms)
}

onMounted(async () => {
  const endpoint = await new WmsEndpoint(wmsLayer.url).isReady()
  const layerInfo = endpoint.getLayerByName(wmsLayer.name)
  styles.value = layerInfo?.styles?.slice(-3).map(s => s.name) ?? []
  currentStyle.value = styles.value[0] ?? ''
  context = updateLayerInContext(context, wmsLayer, { style: currentStyle.value })
  const view = await createViewFromLayer(wmsLayer)
  if (view) context = { ...context, view }
  map = await createMapFromContext(context, mapRoot.value)
  await showLegend(context.layers[1] as MapContextLayerWms)
})
</script>

<template>
  <div class="w-full h-full flex">
    <div ref="mapRoot" class="flex-1 h-full relative">
      <div class="absolute inset-x-4 bottom-4 flex flex-row gap-2 z-50">
        <ButtonSimple v-for="style in styles" :key="style" class="shadow-sm"
          :class="{ '!bg-blue-100 !text-blue-700': currentStyle === style }"
          @click="switchStyle(style)">
          {{ style }}
        </ButtonSimple>
      </div>
    </div>
    <div ref="legendRoot" class="w-48 h-full overflow-auto border-l border-gray-200 bg-white p-2"></div>
  </div>
</template>
