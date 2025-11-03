<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Map from 'ol/Map'
import { createMapFromContext, listen } from '@geospatial-sdk/openlayers'
import type { MapContext } from '@geospatial-sdk/core'
import { DEFAULT_CONTEXT } from '@/constants'
import Panel from '@/components/Panel.vue'
import type { Feature } from 'geojson'
import type { Extent } from 'ol/extent'

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
let extent = ref<Extent | null>(null)

onMounted(async () => {
  map = await createMapFromContext(context, mapRoot.value)
  listen(map, 'features-hover', (event) => (features.value = event.features))
  listen(map, 'map-click', (event) => (clickCoordinates.value = event.coordinate))
  listen(map, 'map-extent-change', (event) => {
    extent.value = event.extent;
  });
})
</script>

<template>
  <div ref="mapRoot" class="w-full h-full relative">
    <div class="absolute top-3 right-3 flex flex-col gap-3 z-50 w-56">
      <Panel v-if="clickCoordinates">
        <strong>Last click coordinates</strong>
        {{ clickCoordinates.join(', ') }}
      </Panel>
      <Panel v-if="extent">
        <h4 class="font-bold mb-1">Map Extent</h4>
        <ul>
          <li><strong>Min X</strong>: {{ extent[0] }}</li>
          <li><strong>Min Y</strong>: {{ extent[1] }}</li>
          <li><strong>Max X</strong>: {{ extent[2] }}</li>
          <li><strong>Max Y</strong>: {{ extent[3] }}</li>
        </ul>
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
