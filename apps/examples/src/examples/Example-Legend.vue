<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { applyContextDiffToMap, createMapFromContext } from '@geospatial-sdk/openlayers'
import { computeMapContextDiff, type MapContext, type MapContextLayerWms } from '@geospatial-sdk/core'
import { createLegendFromLayer } from '@geospatial-sdk/legend'
import ButtonSimple from '@/components/ButtonSimple.vue'

const wmsUrl = 'https://qgisserver.hautsdefrance.fr/cgi-bin/qgis_mapserv.fcgi?MAP=/var/www/data/qgis/applications/limites_admin.qgz'
const styles = ['Etat d\'avancement', 'aplat bleu', 'aplat blanc']

const mapRoot = ref<HTMLElement>()
const legendRoot = ref<HTMLElement>()
const currentStyle = ref(styles[0])
let map: any
let context: MapContext = {
  layers: [
    { type: 'xyz', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' },
    { type: 'wms', url: wmsUrl, name: 'scot_en_cours', style: styles[0] }
  ],
  view: { zoom: 8, center: [2.5, 49.9] }
}

async function showLegend(layer: MapContextLayerWms) {
  legendRoot.value!.innerHTML = ''
  const el = await createLegendFromLayer(layer)
  if (el) legendRoot.value!.appendChild(el)
}

async function switchStyle(style: string) {
  const layer: MapContextLayerWms = { type: 'wms', url: wmsUrl, name: 'scot_en_cours', style }
  const newContext: MapContext = { ...context, layers: [context.layers[0], layer] }
  await applyContextDiffToMap(map, computeMapContextDiff(newContext, context))
  context = newContext
  currentStyle.value = style
  await showLegend(layer)
}

onMounted(async () => {
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
