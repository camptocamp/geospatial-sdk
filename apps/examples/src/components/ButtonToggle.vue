<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  choices: Array<string>
  initialValue: string
}>()
const selected = ref<string>(props.initialValue)
defineEmits(['select'])
</script>

<template>
  <div class="inline-flex rounded-md shadow-sm" role="group">
    <button
      v-for="(choice, index) in choices"
      :key="choice"
      type="button"
      class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700"
      :class="{
        'z-10 ring-2 ring-blue-700 text-blue-700': selected === choice,
        'border rounded-s-lg ml-[2px]': index === 0,
        'border rounded-e-lg mr-[2px]': index === choices.length - 1
      }"
      @click="(selected = choice), $emit('select', choice)"
    >
      {{ choice }}
    </button>
  </div>
</template>

<style scoped></style>
