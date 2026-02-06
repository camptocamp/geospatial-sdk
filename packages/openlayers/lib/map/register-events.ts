import Map from "ol/Map.js";
import {
  FeaturesClickEventType,
  FeaturesHoverEventType,
  MapLayerLoadingStatus,
  MapLayerStateChangeEvent,
  MapLayerStateChangeEventType,
  MapStateChangeEventType,
  MapViewStateChangeEvent,
  MapViewStateChangeEventType,
  ResolvedMapLayerState,
  ResolvedMapState,
} from "@geospatial-sdk/core";
import BaseEvent from "ol/events/Event.js";
import type BaseLayer from "ol/layer/Base.js";
import { readFeaturesAtPixel } from "./get-features.js";
import MapBrowserEvent from "ol/MapBrowserEvent.js";
import { equals } from "ol/extent.js";
import { readMapViewState } from "./resolved-map-state.js";
import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";
import { MapLayerDataInfo } from "@geospatial-sdk/core/lib/model/resolved-map-state.js";

export function registerFeatureClickEvent(map: Map) {
  if (map.get(FeaturesClickEventType)) return;

  // Filter to only query clickable layers
  const layerFilter = (layer: BaseLayer) =>
    layer.get(`${GEOSPATIAL_SDK_PREFIX}clickable`) !== false;

  map.on("click", async (event: MapBrowserEvent<PointerEvent>) => {
    const featuresByLayer = await readFeaturesAtPixel(map, event, layerFilter);
    const features = Array.from(featuresByLayer.values()).flat();
    map.dispatchEvent({
      type: `${GEOSPATIAL_SDK_PREFIX}${FeaturesClickEventType}`,
      features,
      featuresByLayer,
    } as unknown as BaseEvent);
  });

  map.set(FeaturesClickEventType, true);
}

export function registerFeatureHoverEvent(map: Map) {
  if (map.get(FeaturesHoverEventType)) return;
  map.set(FeaturesHoverEventType, true);
}

export function registerMapViewStateChangeEvent(map: Map) {
  if (map.get(MapViewStateChangeEventType)) return;

  let lastExtent: number[] | null = null;

  const handleViewChange = () => {
    const viewState = readMapViewState(map);
    if (lastExtent && equals(lastExtent, viewState.extent)) {
      return;
    }
    lastExtent = viewState.extent;

    map.dispatchEvent({
      type: `${GEOSPATIAL_SDK_PREFIX}${MapViewStateChangeEventType}`,
      viewState,
    } as unknown as BaseEvent);
  };

  map.getView().on("change:center", handleViewChange);
  map.getView().on("change:resolution", handleViewChange);
  map.getView().on("change:rotation", handleViewChange);
  map.on("change:size", handleViewChange);

  map.set(MapViewStateChangeEventType, true);
}

export function registerMapLayerStateChangeEvent(map: Map) {
  if (map.get(MapLayerStateChangeEventType)) return;

  // re-dispatch layer creation error
  map.on(
    `${GEOSPATIAL_SDK_PREFIX}layer-creation-error`,
    (event: BaseEvent & { error: Error }) => {
      map.dispatchEvent({
        type: `${GEOSPATIAL_SDK_PREFIX}${MapLayerStateChangeEventType}`,
        layerState: {
          creationError: true,
          creationErrorMessage: event.error.toString(),
        },
        layerIndex: -1, // layer index is unknown in case of creation error}
      } as unknown as BaseEvent);
    },
  );

  map.set(MapLayerStateChangeEventType, true);
}

export function emitLayerCreationError(map: Map, error: unknown) {
  map.dispatchEvent({
    type: `${GEOSPATIAL_SDK_PREFIX}layer-creation-error`,
    error,
  } as unknown as BaseEvent);
}
export function emitLayerLoadingStatusLoading(layer: BaseLayer) {
  layer.dispatchEvent({
    type: `${GEOSPATIAL_SDK_PREFIX}layer-loading-status`,
    layerState: { loading: true },
  } as unknown as BaseEvent);
}
export function emitLayerLoadingStatusSuccess(layer: BaseLayer) {
  layer.dispatchEvent({
    type: `${GEOSPATIAL_SDK_PREFIX}layer-loading-status`,
    layerState: { loaded: true },
  } as unknown as BaseEvent);
}
export function emitLayerLoadingStatusError(layer: BaseLayer, error: Error) {
  layer.dispatchEvent({
    type: `${GEOSPATIAL_SDK_PREFIX}layer-loading-status`,
    layerState: { loadingError: true, loadingErrorMessage: error.toString() },
  } as unknown as BaseEvent);
}
export function emitLayerDataInfo(
  layer: BaseLayer,
  dataInfo: MapLayerDataInfo,
) {
  layer.dispatchEvent({
    type: `${GEOSPATIAL_SDK_PREFIX}layer-data-info`,
    layerState: dataInfo,
  } as unknown as BaseEvent);
}

export function propagateLayerStateChangeEventToMap(
  map: Map,
  layer: BaseLayer,
) {
  let currentLayerState: Partial<ResolvedMapLayerState> = {
    created: true,
  };
  let currentLoadingStatus: Partial<MapLayerLoadingStatus> = {};

  function updateStateAndEmit(update: Partial<MapLayerDataInfo>) {
    if (!map.get(MapLayerStateChangeEventType)) {
      return;
    }
    currentLayerState = {
      ...currentLayerState,
      ...update,
    };
    const layerIndex = map.getLayers().getArray().indexOf(layer);
    map.dispatchEvent({
      type: `${GEOSPATIAL_SDK_PREFIX}${MapLayerStateChangeEventType}`,
      layerState: {
        ...currentLayerState,
        ...update,
        ...currentLoadingStatus,
      },
      layerIndex,
    } as unknown as BaseEvent);
  }

  // When new information about a layer state is available, add it to the previous state & emit
  layer.on(
    `${GEOSPATIAL_SDK_PREFIX}layer-data-info`,
    (event: MapLayerStateChangeEvent) => {
      updateStateAndEmit(event.layerState);
    },
  );

  // loading state can change over time
  layer.on(
    `${GEOSPATIAL_SDK_PREFIX}layer-loading-status`,
    (event: MapLayerStateChangeEvent) => {
      currentLoadingStatus = event.layerState;
      updateStateAndEmit({});
    },
  );

  // emit initial state
  updateStateAndEmit({});
}

export function registerMapStateChangeEvent(map: Map) {
  if (map.get(MapStateChangeEventType)) return;

  // the global map state requires both view and layers state
  registerMapLayerStateChangeEvent(map);
  registerMapViewStateChangeEvent(map);

  let currentState: ResolvedMapState = {
    layers: [],
    view: null,
  };

  function emitState() {
    // we're making sure to have the right amount of layers in the state and to fill empty slots with null
    currentState.layers.length = map.getLayers().getLength();
    for (let i = 0; i < currentState.layers.length; i++) {
      if (!currentState.layers[i]) {
        currentState.layers[i] = null;
      }
    }
    map.dispatchEvent({
      type: `${GEOSPATIAL_SDK_PREFIX}${MapStateChangeEventType}`,
      mapState: currentState as ResolvedMapState,
    } as unknown as BaseEvent);
  }

  // collect view and layer states to re-emit them as a global state
  map.on(
    `${GEOSPATIAL_SDK_PREFIX}${MapLayerStateChangeEventType}`,
    (event: BaseEvent & MapLayerStateChangeEvent) => {
      const layers = [...currentState.layers];
      layers[event.layerIndex] = event.layerState;
      currentState = { ...currentState, layers };
      emitState();
    },
  );
  map.on(
    `${GEOSPATIAL_SDK_PREFIX}${MapViewStateChangeEventType}`,
    (event: BaseEvent & MapViewStateChangeEvent) => {
      currentState = { ...currentState, view: event.viewState };
      emitState();
    },
  );

  map.set(MapStateChangeEventType, true);
}
