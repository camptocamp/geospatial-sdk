import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";
import type Map from "ol/Map.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import {
  defaultHighlightStyle,
  FeaturesHoverEventType,
} from "@geospatial-sdk/core";
import BaseEvent from "ol/events/Event.js";
import { MapBrowserEvent } from "ol";

const hoverLayerKey = `${GEOSPATIAL_SDK_PREFIX}hover-layer`;

export function initHoverLayer(map: Map) {
  if (map.get(hoverLayerKey)) {
    clearHoverLayer(map)
  }
  const hoverLayer = new VectorLayer({
    source: new VectorSource({
      features: [],
    }),
    style: defaultHighlightStyle,
  });
  map.set(hoverLayerKey, hoverLayer);
  hoverLayer.setMap(map);

  map.on("pointermove", async (event: MapBrowserEvent) => {
    // skip hit detection if the view is moving as it can have an impact on performance
    if (map.getView().getInteracting() || map.getView().getAnimating()) {
      return;
    }

    const features = await readFeaturesAtPixel(map, event);
    map.dispatchEvent({
      type: FeaturesHoverEventType,
      features,
    } as unknown as BaseEvent);
  });
}

export function getHoverLayer(map: Map): VectorLayer<VectorSource> {
  return map.get(hoverLayerKey) as VectorLayer<VectorSource>;
}

export function clearHoverLayer(map: Map) {
  const hoverLayer = getHoverLayer(map);
  hoverLayer.setMap(null)
  hoverLayer.dispose()
  map.set(hoverLayerKey, null);
}
