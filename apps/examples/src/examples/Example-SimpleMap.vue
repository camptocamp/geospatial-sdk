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
        }
      ],
      view: {
        zoom: 5,
        center: [6, 48.5]
      }
    },
    mapRoot.value
  )
})
</script>

<template>
  <div ref="mapRoot" class="w-full h-full"></div>
</template>
