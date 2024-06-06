<script setup lang="ts">
import TextInput from '@/components/TextInput.vue'
import ButtonToggle from '@/components/ButtonToggle.vue'
import { ref } from 'vue'
import {
  type GeocodingResult,
  queryDataGouvFr,
  queryGeoadmin,
  queryGeonames
} from '@geospatial-sdk/geocoding'

const provider = ref('Geonames')
const results = ref<GeocodingResult[]>([])
const searchText = ref('')

function selectProvider(value: string) {
  provider.value = value
  queryResults(searchText.value)
}

function getQueryFunction() {
  switch (provider.value) {
    case 'Geoadmin':
      return queryGeoadmin
    case 'adresse.data.gouv.fr':
      return queryDataGouvFr
    case 'Geonames':
    default:
      return queryGeonames
  }
}

async function queryResults(newText: string) {
  if (newText.length < 3) {
    return
  }
  searchText.value = newText
  const queryFn = getQueryFunction()
  results.value = await queryFn(newText)
}
</script>

<template>
  <p class="text-gray-500 text-sm mb-2">
    Choose one of the supported providers and write something to trigger a search.
  </p>
  <div class="flex flex-row my-3 gap-3">
    <TextInput placeholder="Type something here" @value-change="queryResults" />
    <ButtonToggle
      :choices="['Geonames', 'Geoadmin', 'adresse.data.gouv.fr']"
      :initialValue="provider"
      @select="selectProvider"
    />
  </div>
  <div class="p-1">
    {{ results.length }} results found.
    <ul class="list-disc h-[385px] overflow-auto">
      <li class="ml-6" v-for="result in results" v-bind:key="result.label">
        {{ result.label }}
      </li>
    </ul>
  </div>
</template>
