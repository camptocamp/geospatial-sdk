<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMapContextStore } from '@/stores/mapContext'
import type { Coordinate } from '@geospatial-sdk/core'

const contextStore = useMapContextStore()
const query = ref('')
const results = ref<{ label: string; coordinates: Coordinate }[]>([])
const isSearching = ref(false)
const showResults = ref(false)

let debounceTimer: ReturnType<typeof setTimeout>

watch(query, (val) => {
  clearTimeout(debounceTimer)
  if (!val || val.length < 3) {
    results.value = []
    showResults.value = false
    return
  }
  debounceTimer = setTimeout(async () => {
    isSearching.value = true
    try {
      const { queryGeonames } = await import('@geospatial-sdk/geocoding')
      const res = await queryGeonames(val)
      results.value = res
        .filter((r) => r.geom && 'coordinates' in r.geom)
        .map((r) => ({
          label: r.label,
          coordinates: (r.geom as unknown as { coordinates: Coordinate }).coordinates,
        }))
      showResults.value = results.value.length > 0
    } catch {
      results.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
})

function hideResults() {
  window.setTimeout(() => (showResults.value = false), 200)
}

function selectResult(result: (typeof results.value)[number]) {
  contextStore.setContext({
    ...contextStore.context,
    view: { center: result.coordinates, zoom: 12 },
  })
  showResults.value = false
  query.value = result.label
}
</script>

<template>
  <div class="relative">
    <UInput
      v-model="query"
      placeholder="Search location..."
      icon="i-lucide-search"
      size="sm"
      class="w-60"
      @focus="showResults = results.length > 0"
      @blur="hideResults"
    />
    <div
      v-if="showResults"
      class="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
    >
      <button
        v-for="(result, i) in results"
        :key="i"
        class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
        @mousedown.prevent="selectResult(result)"
      >
        {{ result.label }}
      </button>
    </div>
  </div>
</template>
