<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createMapFromContext } from '@geospatial-sdk/maplibre'
import { type MapContext } from '@geospatial-sdk/core'

const mapRoot = ref<HTMLElement>()

onMounted(async () => {
  const context: MapContext = {
    layers: [
      {
        type: 'xyz',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      },
      {
        type: 'geotiff',
        url: 'https://labs.geomatico.es/maplibre-cog-protocol/data/image.tif',
      }
    ],
    view: {
      center: [1.83369, 41.5937],
      zoom: 14
    }
  }

  await createMapFromContext(context, {
    container: mapRoot.value as HTMLElement
  })
})
</script>

<template>
  <div ref="mapRoot" class="w-full h-full"></div>
</template>
