<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Map from 'ol/Map'
import { createMapFromContext, listen } from '@geospatial-sdk/openlayers'
import type { FeaturesHoverEvent, MapClickEvent, MapContext } from '@geospatial-sdk/core'
import { DEFAULT_CONTEXT } from '@/constants'
import Panel from '@/components/Panel.vue'
import type { Feature } from 'geojson'

const Layers = {
  wms: {
    type: 'wms',
    url: 'https://ows.emodnet-bathymetry.eu/wms',
    name: 'emodnet:mean_rainbowcolour'
  },
  geojson: {
    type: 'geojson',
    url: 'https://france-geojson.gregoiredavid.fr/repo/regions.geojson'
  }
}

const mapRoot = ref<HTMLElement>()
let map: Map
let context = {
  ...DEFAULT_CONTEXT,
  layers: [...DEFAULT_CONTEXT.layers, Layers.wms, Layers.geojson]
} as MapContext
let features = ref<Feature[]>([])
let clickCoordinates = ref<[number, number] | null>(null)

onMounted(async () => {
  map = await createMapFromContext(context, mapRoot.value)
  listen(map, 'features-hover', (event: FeaturesHoverEvent) => (features.value = event.features))
  listen(map, 'map-click', (event: MapClickEvent) => (clickCoordinates.value = event.coordinate))
})
</script>

<template>
  <div ref="mapRoot" class="w-full h-full relative">
    <div class="absolute top-3 right-3 flex flex-col gap-3 z-50 w-56">
      <Panel v-if="clickCoordinates">
        <strong>Last click coordinates</strong>
        {{ clickCoordinates.join(', ') }}
      </Panel>
      <Panel v-for="(feature, index) in features" v-bind:key="index">
        <h4 class="font-bold mb-1">Feature</h4>
        <ul>
          <li v-for="(value, key) in feature.properties" v-bind:key="key">
            <strong>{{ key }}</strong
            >:&nbsp;{{ value }}
          </li>
        </ul>
      </Panel>
    </div>
  </div>
</template>
