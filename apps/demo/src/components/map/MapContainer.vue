<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapContextStore } from '@/stores/mapContext'
import { useMapRendererStore } from '@/stores/mapRenderer'

const mapTarget = ref<HTMLElement | null>(null)
const contextStore = useMapContextStore()
const rendererStore = useMapRendererStore()
const { context } = storeToRefs(contextStore)
const { isLoading } = storeToRefs(rendererStore)

onMounted(async () => {
  if (mapTarget.value) {
    await rendererStore.createMap(context.value, mapTarget.value)
  }
})

watch(
  context,
  async (newContext, oldContext) => {
    if (oldContext) {
      await rendererStore.applyDiff(newContext, oldContext)
    }
  },
)

onBeforeUnmount(() => {
  rendererStore.destroyMap()
})

defineExpose({ mapTarget })
</script>

<template>
  <div class="relative h-full w-full">
    <div ref="mapTarget" class="h-full w-full" />
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white/50">
      <UIcon name="i-lucide-loader-circle" class="animate-spin text-2xl" />
    </div>
  </div>
</template>
