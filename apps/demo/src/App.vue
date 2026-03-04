<script setup lang="ts">
import { ref } from 'vue'
import MapContainer from '@/components/map/MapContainer.vue'
import RendererSwitch from '@/components/toolbar/RendererSwitch.vue'
import LayerPanel from '@/components/layers/LayerPanel.vue'
import ContextViewer from '@/components/context/ContextViewer.vue'
import GeocodingSearch from '@/components/toolbar/GeocodingSearch.vue'

const mapContainer = ref<InstanceType<typeof MapContainer> | null>(null)
</script>

<template>
  <UApp>
    <div class="flex h-screen flex-col">
      <!-- Top toolbar -->
      <header class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <h1 class="text-lg font-semibold">Geospatial SDK Playground</h1>
        <div class="flex items-center gap-4">
          <GeocodingSearch />
          <RendererSwitch :map-target="mapContainer?.mapTarget ?? null" />
        </div>
      </header>

      <!-- Main content -->
      <div class="flex min-h-0 flex-1">
        <!-- Left sidebar -->
        <aside class="flex w-80 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
          <div class="flex-1 overflow-y-auto">
            <LayerPanel />
          </div>
          <div class="border-t border-gray-200 px-3 py-2 text-xs text-gray-400">
            Powered by <a href="https://www.camptocamp.com" target="_blank" class="font-bold hover:underline"><span class="text-gray-500">camp</span><span style="color: var(--ui-primary)">to</span><span class="text-gray-500">camp</span></a>
          </div>
        </aside>

        <!-- Map -->
        <main class="relative min-w-0 flex-1">
          <MapContainer ref="mapContainer" />
          <ContextViewer />
        </main>
      </div>
    </div>
  </UApp>
</template>
