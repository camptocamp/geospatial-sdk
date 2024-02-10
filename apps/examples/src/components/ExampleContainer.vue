<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps(['exampleName', 'exampleId', 'sourceCode'])
const previewShown = ref(true)

function showPreview(event) {
  previewShown.value = true
  event.preventDefault()
}
function showCode(event) {
  previewShown.value = false
  event.preventDefault()
}
</script>

<template>
  <div :id="exampleId" :data-cy="exampleId" class="relative my-6">
    <div class="flex flex-row justify-between mb-3">
      <h2>{{ props.exampleName }}</h2>
      <div>
        <a class="p-2" href @click="showPreview">Preview</a>
        |
        <a class="p-2" href @click="showCode">Code</a>
      </div>
    </div>
    <div
      class="flex flex-row h-[500px] gap-[16px] transition-all ease-out duration-300"
      :style="previewShown ? 'margin-right: -716px' : 'margin-left: -716px'"
    >
      <div class="w-[700px] rounded overflow-hidden" ref="root"><slot></slot></div>
      <pre
        class="w-[700px] h-full overflow-auto text-sm rounded"
      ><code class="ts">{{ sourceCode }}</code></pre>
    </div>
    <div class="fade-side left"></div>
    <div class="fade-side right"></div>
  </div>
</template>

<style scoped>
.fade-side {
  position: absolute;
  top: 0;
  bottom: 0;
  width: calc(50vw - 350px - 50px);
  pointer-events: none;
  z-index: 100;
}
.fade-side.left {
  right: calc(100% + 50px);
  background-image: linear-gradient(-90deg, transparent 0%, rgba(255, 255, 255, 95%) 400px);
}
.fade-side.right {
  left: calc(100% + 50px);
  background-image: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 95%) 400px);
}
</style>
