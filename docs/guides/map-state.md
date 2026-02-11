---
outline: deep
editLink: true
lastUpdated: true
---

# Reading a map current state

Using [Map Contexts](./map-context.md) is useful to create maps easily and quickly, but they have a significant limitation: **they are one-way and do not update when the map changes later on**.

To solve this, the SDK provides several events that can be listened to in order to keep an up-to-date state of the map in the application side. These events can be found here: [Map state change events](events.md#map-state-change-events)

## Getting the current map state

Simply listen to the `map-state-change` event:

```typescript
import { listen } from "@geospatial-sdk/openlayers";

// ... create the map, etc.

listen(map, "map-state-change", (event) => {
  console.log("The map state has changed", event.mapState);
});
```

The `mapState` object (see [`ResolvedMapState`](../api/%F0%9F%93%A6-core/interfaces/ResolvedMapState.html) reference) contains the latest, up-to-date state of the map, including:

- the current view (center, zoom, rotation...) as a [`ResolvedMapViewState`](../api/%F0%9F%93%A6-core/interfaces/ResolvedMapViewState.html) object
- the state of each layer (whether it is loading, encountered an error, etc.) as an array of [`ResolvedMapLayerState`](../api/📦-core/type-aliases/ResolvedMapLayerState.html) objects

::: tip

The `mapState` object mostly contains information that _cannot be found_ in the Map Context. This is on purpose, as both are meant to be complimentary!

:::

## Storing the map state in an application store

Once the `mapState` object is obtained from the event, an efficient way to store it in the application is to keep it next to the Map Context in the same store.

With [Vue](https://vuejs.org/) and [Pinia](https://pinia.vuejs.org/) this could look like so:

`map.store.ts`

```typescript
import { computed, ref, type Ref } from "vue";
import { defineStore } from "pinia";
import {
  type MapContext,
  type MapContextLayer,
  type MapContextView,
  type ResolvedMapState,
} from "@geospatial-sdk/core";

export const useMapStore = defineStore("map", () => {
  // the map context and map state are stored in parallel; both have the
  // same amount of layers
  const mapContext = ref<MapContext>(DEFAULT_MAP_CONTEXT);
  const mapState = ref<ResolvedMapState>({ layers: [], view: null });

  // using computed properties to have easy to use objects for downstream components
  const currentExtent = computed<Extent | null>(
    () => mapState.value.view?.extent ?? null,
  );
  const layerModels = computed(() => mapContext.value.layers);
  const layerStates = computed(() => mapState.value.layers);

  function setMapState(newState: ResolvedMapState) {
    mapState.value = newState;
  }

  return {
    mapContext,
    mapState,
    currentExtent,
    layerModels,
    layerStates,
    setMapState,
  };
});
```

Then, listening to the `map-state-change` event can be done in the component that maintains the actual map instance:

`MapContainer.vue`

```vue
<script setup lang="ts">
import { useMapStore } from "./map.store";
import {
  computeMapContextDiff,
  type MapStateChangeEvent,
} from "@geospatial-sdk/core";
import {
  applyContextDiffToMap,
  createMapFromContext,
  listen,
} from "@geospatial-sdk/openlayers";
import type Map from "ol/Map";
import { storeToRefs } from "pinia";
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

const mapStore = useMapStore();
const { mapContext, setMapState } = storeToRefs(mapStore);

const mapContainer = ref<HTMLElement | undefined>();
const mapRef = shallowRef<Map | null>(null);
const lastClickCoordinate = ref<[number, number] | null>(null);

onMounted(async () => {
  // initial creation of the map
  mapRef.value = await createMapFromContext(
    mapContext.value,
    mapContainer.value,
  );

  // update the map state in the store whenever it changes
  listen(mapRef.value, "map-state-change", (event: MapStateChangeEvent) => {
    setMapState(event.mapState);
  });
});

// apply the context diff whenever the context changes
watch(mapContext, (newContext, oldContext) => {
  if (!mapRef.value) return;
  const diff = computeMapContextDiff(newContext, oldContext);
  applyContextDiffToMap(mapRef.value, diff);
});

// dispose the map on unmount
onBeforeUnmount(() => {
  if (!mapRef.value) return;
  mapRef.value.setTarget(undefined);
  mapRef.value.dispose();
  mapRef.value = null;
});
</script>

<template>
  <div ref="mapContainer"></div>
</template>
```

Finally, a downstream component can simply query the state of each layer like so:

`LayerList.vue`

```vue
<script setup lang="ts">
import { useMapStore } from "./map.store";
import { storeToRefs } from "vue";

const mapStore = useMapStore();
const { layerModels, layerStates } = storeToRefs(mapStore);
</script>

<template>
  <p>List of layers:</p>
  <ul>
    <li v-for="(layer, index) in layerModels" :key="index">
      {{ layer.label }} - state: {{ layerStates[index].state }}
    </li>
  </ul>
</template>
```

## Tracking layer errors

The `mapState` object contains the latest state of each layer. This means that if a layer first encounters a loading error but then recovers, the first loading error will be lost.

To keep track more precisely of all errors happening at the layer level, use the `layer-creation-error` and `layer-loading-error` events. This can be done in complement with the `map-state-change` event, and for instance be used to show notifications to the user.

See the [Events guide](./events.md) for more information.
