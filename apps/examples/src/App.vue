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
import ExampleCustomElementsHtml from '@/examples/Example-CustomElements.html?raw'
import ExampleMaplibreRaw from '@/examples/Example-Maplibre.vue?raw'
import ExampleMaplibre from '@/examples/Example-Maplibre.vue'
import { onMounted, ref } from 'vue'
import hljs from 'highlight.js'
import '@geospatial-sdk/elements'

function loadHtmlExample(html: string, root: HTMLElement) {
  const template = document.createElement('template')
  template.innerHTML = html
  const geosdkMap = template.content.querySelector('geosdk-map')!
  const geosdkScript = template.content.querySelector('script')!
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.textContent = geosdkScript.textContent
  root.appendChild(geosdkMap)
  root.appendChild(script)
}

const example06_root = ref<HTMLElement>()
onMounted(() => {
  if (example06_root.value) {
    loadHtmlExample(ExampleCustomElementsHtml as string, example06_root.value)    
  }
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
      :source-code="ExampleCustomElementsHtml"
    >
      <div class="w-full h-full" ref="example06_root"></div>
    </ExampleContainer>
    <ExampleContainer
      example-name="Example 7: Maplibre"
      example-id="example07"
      :source-code="ExampleMaplibreRaw"
    >
     <ExampleMaplibre></ExampleMaplibre>
    </ExampleContainer>
  </div>
</template>

<style scoped></style>
