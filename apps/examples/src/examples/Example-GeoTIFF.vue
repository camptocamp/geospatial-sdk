<script setup lang="ts">
import { createMapFromContext } from '@geospatial-sdk/openlayers'
import { onMounted, ref } from 'vue'

const mapRoot = ref<HTMLElement>()

onMounted(() => {
  createMapFromContext(
    {
      layers: [
        {
          type: 'xyz',
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        },
        {
          type: 'geotiff',
          url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif'
        }
      ],
      view: {
        zoom: 10,
        center: [34.8, 31.2]
      }
    },
    mapRoot.value
  )
})
</script>

<template>
  <div ref="mapRoot" class="w-full h-full"></div>
</template>
