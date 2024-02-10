<script setup lang="ts">
import debounce from 'lodash.debounce'

defineProps(['placeholder'])
const emit = defineEmits(['valueChange'])

const debouncedInput = debounce((event) => {
  emit('valueChange', event.target.value)
}, 300)
</script>

<template>
  <input
    type="text"
    id="first_name"
    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
    :placeholder="placeholder"
    @input="debouncedInput"
  />
</template>
