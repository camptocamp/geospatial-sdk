<script setup lang="ts">
import ExampleContainer from '@/components/ExampleContainer.vue'
import ExampleSimpleMap from '@/examples/Example-SimpleMap.vue'
import ExampleSimpleMapRaw from '@/examples/Example-SimpleMap.vue?raw'
import ExampleMapAddRemoveLayers from '@/examples/Example-MapAddRemoveLayers.vue'
import ExampleMapAddRemoveLayersRaw from '@/examples/Example-MapAddRemoveLayers.vue?raw'
import ExampleGeocoding from '@/examples/Example-Geocoding.vue'
import ExampleGeocodingRaw from '@/examples/Example-Geocoding.vue?raw'
import ExampleZoomToLayer from '@/examples/Example-ZoomToLayer.vue'
import ExampleZoomToLayerRaw from '@/examples/Example-ZoomToLayer.vue?raw'
import ExampleMapEvents from '@/examples/Example-MapEvents.vue'
import ExampleMapEventsRaw from '@/examples/Example-MapEvents.vue?raw'
import ExampleCustomElements from '@/examples/Example-CustomElements.vue'
import ExampleCustomElementsRaw from '@/examples/Example-CustomElements.vue?raw'
import { onMounted } from 'vue'
import hljs from 'highlight.js'

onMounted(() => {
  hljs.highlightAll()
})
</script>

<template>
  <div class="flex flex-col items-center p-4 overflow-x-hidden">
    <h1 class="text-5xl font-bold m-6">Geospatial SDK</h1>
    <p class="mb-6">An incredible SDK with many examples.</p>
    <p class="mb-6">
      <a href="https://camptocamp.github.io/geospatial-sdk/docs/"
        >Go to the documentation website</a
      >
    </p>
    <ExampleContainer
      example-name="Example 1: simple map"
      example-id="example01"
      :source-code="ExampleSimpleMapRaw"
    >
      <ExampleSimpleMap></ExampleSimpleMap>
    </ExampleContainer>
    <ExampleContainer
      example-name="Example 2: add and remove layers"
      example-id="example02"
      :source-code="ExampleMapAddRemoveLayersRaw"
    >
      <ExampleMapAddRemoveLayers></ExampleMapAddRemoveLayers>
    </ExampleContainer>
    <ExampleContainer
      example-name="Example 3: zoom to layers"
      example-id="example03"
      :source-code="ExampleZoomToLayerRaw"
    >
      <ExampleZoomToLayer></ExampleZoomToLayer>
    </ExampleContainer>
    <ExampleContainer
      example-name="Example 4: map events"
      example-id="example04"
      :source-code="ExampleMapEventsRaw"
    >
      <ExampleMapEvents></ExampleMapEvents>
    </ExampleContainer>
    <ExampleContainer
      example-name="Example 5: geocoding"
      example-id="example05"
      :source-code="ExampleGeocodingRaw"
    >
      <ExampleGeocoding></ExampleGeocoding>
    </ExampleContainer>
    <ExampleContainer
      example-name="Example 6: show a map using a custom element"
      example-id="example06"
      :source-code="ExampleCustomElementsRaw"
    >
      <ExampleCustomElements></ExampleCustomElements>
    </ExampleContainer>
  </div>
</template>

<style scoped></style>
