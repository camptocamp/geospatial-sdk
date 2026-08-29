<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMapContextStore } from '@/stores/mapContext'
import LayerListItem from './LayerListItem.vue'

const contextStore = useMapContextStore()
const { context } = storeToRefs(contextStore)

function onUpdateVisibility(index: number, visible: boolean) {
  contextStore.updateLayer(index, { visibility: visible })
}

function onUpdateOpacity(index: number, opacity: number) {
  contextStore.updateLayer(index, { opacity })
}

function onMoveUp(index: number) {
  if (index > 0) contextStore.moveLayer(index, index - 1)
}

function onMoveDown(index: number) {
  if (index < context.value.layers.length - 1) contextStore.moveLayer(index, index + 1)
}
</script>

<template>
  <div>
    <div v-if="context.layers.length === 0" class="p-4 text-center text-sm text-gray-400">
      No layers added yet
    </div>
    <LayerListItem
      v-for="(layer, index) in context.layers"
      :key="index"
      :layer="layer"
      :index="index"
      @remove="contextStore.removeLayer"
      @update:visibility="onUpdateVisibility"
      @update:opacity="onUpdateOpacity"
      @move-up="onMoveUp"
      @move-down="onMoveDown"
    />
  </div>
</template>
