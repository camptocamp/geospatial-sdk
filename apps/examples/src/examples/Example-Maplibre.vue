<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createMapFromContext } from '@geospatial-sdk/maplibre'
import { type MapContext, type MapContextLayerWms } from '@geospatial-sdk/core'

const Layers = {
  maplibre: {
    type: 'maplibre-style',
    styleUrl: 'https://demo.baremaps.com/style.json',
    accessToken: 'abcdefgh'
  },
  wms: {
    type: 'wms',
    url: 'https://data.geopf.fr/wms-r/wms',
    name: 'INSEE.FILOSOFI.POPULATION'
  } as MapContextLayerWms,
  wfs: {
    type: 'wfs',
    url: 'https://data.lillemetropole.fr/geoserver/dsp_ilevia/ows?REQUEST=GetCapabilities&SERVICE=WFS&VERSION=2.0.0',
    featureType: 'ilevia_traceslignes',
    label: 'Tracé des lignes de bus',
    visibility: true,
    attributions: 'camptocamp',
    opacity: 0.5
  },
  geojson: {
    id: 'geojson',
    type: 'geojson',
    url: 'https://data.lillemetropole.fr/data/ogcapi/collections/roubaix:implantation_des_arceaux_velos_a_roubaix/items?f=geojson&limit=-1'
  },
  ogcapi: {
    type: 'ogcapi',
    url: 'https://data.lillemetropole.fr/data/ogcapi/collections/ilevia:abris_velo/items?f=json&limit=-1',
    collection: 'ilevia:abris_velo'
  }
}

const mapRoot = ref<HTMLElement>()
let context = {
  view: {
    zoom: 10,
    center: [3.1626248124366176, 50.67829080457065]
  },
  layers: Object.keys(Layers).map(key => Layers[key as keyof typeof Layers])
}

onMounted(async () => {
  await createMapFromContext(<MapContext>context, {
    container: <HTMLElement>mapRoot.value
  })
})

</script>

<template>
  <div ref="mapRoot" class="w-full h-full relative">
    <div class="absolute inset-x-4 bottom-4 flex flex-row gap-4 z-50">
    </div>
  </div>
</template>
