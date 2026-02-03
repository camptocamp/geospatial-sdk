import Map from "ol/Map.js";
import {
  FeaturesClickEventType,
  FeaturesHoverEventType,
  MapViewStateChangeEventType,
} from "@geospatial-sdk/core";
import BaseEvent from "ol/events/Event.js";
import type BaseLayer from "ol/layer/Base.js";
import { readFeaturesAtPixel } from "./get-features.js";
import MapBrowserEvent from "ol/MapBrowserEvent.js";
import { equals } from "ol/extent.js";
import { readMapViewState } from "./resolved-map-state.js";
import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";

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
