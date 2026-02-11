---
outline: deep
editLink: true
lastUpdated: true
---

# Events

Events are a simple and consistent way to be notified of things happening in a map that was created using a [Map Context](./map-context.md).

## Subscribing to Events

To subscribe to events, use the `listen` function provided by whichever package you are using to render the map. For example, with OpenLayers:

```typescript
import { createMapFromContext, listen } from "@geospatial-sdk/openlayers";

// create the OpenLayers map using a Map Context
const map = await createMapFromContext({ ... });

listen(map, 'features-click', (event) => {
  console.log("The following features were clicked", event.features);
});
```

## Available Events

### 📬 `features-click`

Returns a [`FeaturesClickEvent`](../api/📦-core/interfaces/FeaturesClickEvent.html) when the user clicks on a point of the map where one or several features are present.

Returns an empty array of features if no feature was present at the clicked location.

Note that only layers which have the `clickable` property set to `true` will be looked at (see the [`MapContextBaseLayer`](../api/📦-core/interfaces/MapContextBaseLayer.html) reference).

All features returned are standard GeoJSON with coordinates projected in longitude and latitude (EPSG:4326).

A [`FeatureByLayerIndex`](../api/📦-core/type-aliases/FeaturesByLayerIndex.html) object is also provided, so that the application can figure from which layer comes each feature.

### 📬 `features-hover`

Returns a [`FeaturesHoverEvent`](../api/📦-core/interfaces/FeaturesHoverEvent.html) when the pointer goes over one or more features on the map. Listening to this event can have a significant performance impact.

Does not trigger if the pointer is over no detectable feature at all.

Note that only layers which have the `hoverable` property set to `true` will be looked at (see the [`MapContextBaseLayer`](../api/📦-core/interfaces/MapContextBaseLayer.html) reference).

All features returned are standard GeoJSON with coordinates projected in longitude and latitude (EPSG:4326).

A [`FeatureByLayerIndex`](../api/📦-core/type-aliases/FeaturesByLayerIndex.html) object is also provided, so that the application can figure from which layer comes each feature.

### 📬 `map-click`

Returns a [`MapClickEvent`](../api/📦-core/interfaces/MapClickEvent.html) when the user clicks on the map. Coordinates are projected in longitude and latitude (EPSG:4326).

### 📬 `layer-creation-error`

Returns a [`LayerCreationErrorEvent`](../api/📦-core/interfaces/LayerCreationErrorEvent.html) when a layer fails to be created from a Map Context. This typically happens when a layer definition is invalid (e.g. missing required properties), or if a layer type is not supported by the chosen rendering library.

This information can also be found in the updated Map State (see below).

### 📬 `layer-loading-error`

Returns a [`LayerLoadingErrorEvent`](../api/📦-core/interfaces/LayerLoadingErrorEvent.html) when a layer fails to load. This typically happens when the source of the layer is not reachable, or if the data provided by the source is invalid.

### Map state change events

These events can be subscribed to in order to store an up-to-date state of the map in the application. This can be done either for the view (`map-view-state-change`), for the layers (`map-layer-state-change`) or for the whole map (`map-state-change`). See the [Map State guide](./map-state.md) for more information and guidance.

#### 📬 `map-view-state-change`

Returns a [`MapViewStateChangeEvent`](../api/📦-core/interfaces/MapViewStateChangeEvent.html) when the map view changes.

#### 📬 `map-layer-state-change`

Returns a [`MapLayerStateChangeEvent`](../api/📦-core/interfaces/MapLayerStateChangeEvent.html) when the state of one layer changes.

This will also gather errors that are emitted through the `layer-creation-error` and `layer-loading-error` events, so that the application can easily keep track of which layers are in error state.

#### 📬 `map-state-change`

Returns a [`MapStateChangeEvent`](../api/📦-core/interfaces/MapStateChangeEvent.html) when anything in the map state changes.

### Deprecated events

#### 📬 `map-extent-change`

Returns a [`MapExtentChangeEvent`](../api/📦-core/interfaces/MapExtentChangeEvent.html) when the map extent changes. This event is deprecated in favor of `map-view-state-change`, which provides more information about the view change.

#### 📬 `source-load-error`

Returns a [`SourceLoadErrorEvent`](../api/📦-core/classes/SourceLoadErrorEvent.html) when a source fails to load. This event is deprecated in favor of `layer-loading-error`, which provides more information about the layer that failed to load.
