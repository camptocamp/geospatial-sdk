<script setup lang="ts">
import ExampleContainer from '@/components/ExampleContainer.vue'
import Example01SimpleMap from '@/examples/Example-01-SimpleMap.vue'
import Example01SimpleMapRaw from '@/examples/Example-01-SimpleMap.vue?raw'
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
    <ExampleContainer
      example-name="Example 1: simple map"
      example-id="example01"
      :source-code="Example01SimpleMapRaw"
    >
      <Example01SimpleMap></Example01SimpleMap>
    </ExampleContainer>
  </div>
</template>

<style scoped></style>
