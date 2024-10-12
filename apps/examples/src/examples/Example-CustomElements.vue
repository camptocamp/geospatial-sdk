<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { SdkMapElement } from '@geospatial-sdk/elements'
import '@geospatial-sdk/elements' // this includes the web component

const mapElement = ref<SdkMapElement>()
onMounted(() => {
  if (!mapElement.value) return
  mapElement.value.context = {
    layers: [
      {
        type: 'maplibre-style',
        styleUrl:
          'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json'
      }
    ],
    view: {
      zoom: 12,
      center: [2.33, 48.86]
    }
  }
})
</script>

<template>
  <geosdk-map ref="mapElement"></geosdk-map>
</template>
