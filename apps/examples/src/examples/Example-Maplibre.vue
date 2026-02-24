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
    id: 'wms-population',
    url: 'https://data.geopf.fr/wms-r/wms',
    name: 'INSEE.FILOSOFI.POPULATION',
    label: 'Population INSEE',
    visibility: true,
    opacity: 0.7,
    attributions: '© IGN - INSEE',
    version: 0,
  } as MapContextLayerWms,
  wfs: {
    type: 'wfs',
    url: 'https://data.lillemetropole.fr/geoserver/dsp_ilevia/ows?REQUEST=GetCapabilities&SERVICE=WFS&VERSION=2.0.0',
    featureType: 'ilevia_traceslignes',
    label: 'Lignes de bus Ilevia (WFS)',
    visibility: true,
    opacity: 0.8,
    attributions: '© MEL - Ilevia',
    hoverable: true,
    style: {
      "stroke-color": 'rgba(0, 200, 100, 0.5)',
      "stroke-width": 2,
    },
  },
  geojson: {
    id: 'geojson',
    type: 'geojson',
    url: 'https://data.lillemetropole.fr/data/ogcapi/collections/roubaix:implantation_des_arceaux_velos_a_roubaix/items?f=geojson&limit=-1',
    style: {
      "circle-fill-color": 'rgba(255, 0, 0, 0.5)',
      "circle-stroke-color": 'rgba(255, 0, 0, 1)',
      "circle-stroke-width": 2,
    },
  },
  ogcapi: {
    type: 'ogcapi',
    url: 'https://data.lillemetropole.fr/data/ogcapi/',
    collection: 'mobilite_et_transport:pm2035_action_sdvelo_pointsdurs',
    options: {
      outputFormat: 'application/geo+json',
      limit: -1,
    },
    label: 'Schéma cyclable - points durs (OGC API)',
    visibility: true,
    style: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 1,10, 5],
    },
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
