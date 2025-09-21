<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createMapFromContext } from '@geospatial-sdk/maplibre'
import { type MapContextLayerWms } from '@geospatial-sdk/core'
import { Map } from 'maplibre-gl'

const Layers = {
  wms: {
    type: 'wms',
    url: 'https://data.geopf.fr/wms-r/wms',
    name: 'INSEE.FILOSOFI.POPULATION'
  } as MapContextLayerWms,
  geojson: {
    id: 'geojson',
    type: 'geojson',
    url: 'https://data.lillemetropole.fr/data/ogcapi/collections/roubaix:implantation_des_arceaux_velos_a_roubaix/items?f=geojson&limit=-1'
  }
}

const mapRoot = ref<HTMLElement>()
let map: Map
let context = {
  view: {
    zoom: 5,
    center: [6, 48.5]
  },
  layers: [Layers.wms, Layers.geojson],
}

onMounted(async () => {
  map = await createMapFromContext(context, mapRoot.value)
})

</script>

<template>
  <div ref="mapRoot" class="w-full h-full relative">
    <div class="absolute inset-x-4 bottom-4 flex flex-row gap-4 z-50">
    </div>
  </div>
</template>
