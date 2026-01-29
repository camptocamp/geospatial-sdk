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
import GeoJSON from "ol/format/GeoJSON.js";
import Feature from "ol/Feature.js";
import BaseLayer from "ol/layer/Base.js";

const GEOJSON = new GeoJSON();

const hoverLayerKey = `${GEOSPATIAL_SDK_PREFIX}hover-layer`;
const unsubscribeKey = `${GEOSPATIAL_SDK_PREFIX}hover-unsub`;

export function initHoverLayer(map: Map) {
  if (map.get(hoverLayerKey)) {
    clearHoverLayer(map);
  }

  // create layer & add on top of everything else
  const hoverLayer = new VectorLayer({
    source: new VectorSource({
      features: [],
      useSpatialIndex: false,
    }),
    style: defaultHighlightStyle,
  });
  map.set(hoverLayerKey, hoverLayer);
  hoverLayer.setMap(map);

  // store original cursor style in order to change it later
  const originalCursorStyle = map.getTargetElement()?.style.cursor ?? "";

  const layerFilter = (layer: BaseLayer) =>
    layer !== hoverLayer && layer.get(`${GEOSPATIAL_SDK_PREFIX}enable-hover`);

  const unKey = map.on(
    "pointermove",
    async (event: MapBrowserEvent<PointerEvent>) => {
      // skip hit detection if the view is moving as it can have an impact on performance
      if (map.getView().getInteracting() || map.getView().getAnimating()) {
        return;
      }

      // change cursor if above a feature
      const hasFeature = map.hasFeatureAtPixel(event.pixel, {
        layerFilter,
      });
      map.getTargetElement().style.cursor = hasFeature
        ? "pointer"
        : originalCursorStyle;

      const hoveredSource = hoverLayer.getSource() as VectorSource;
      hoveredSource.clear(true);
      if (!hasFeature) {
        return;
      }

      // add hovered feature to the layer
      const hovered = map.getFeaturesAtPixel(event.pixel, {
        layerFilter,
      }) as Feature[];
      hoveredSource.addFeature(hovered[0]);

      // dispatch event if subscribed to
      if (map.get(FeaturesHoverEventType)) {
        const { features } = GEOJSON.writeFeaturesObject(hovered);
        map.dispatchEvent({
          type: FeaturesHoverEventType,
          features: features ?? [],
        } as unknown as BaseEvent);
      }
    },
  );
  map.set(unsubscribeKey, unKey);
}

export function getHoverLayer(map: Map): VectorLayer<VectorSource> {
  return map.get(hoverLayerKey) as VectorLayer<VectorSource>;
}

export function clearHoverLayer(map: Map) {
  const hoverLayer = getHoverLayer(map);
  hoverLayer.setMap(null);
  hoverLayer.dispose();
  map.set(hoverLayerKey, null);
  console.log(map.get);
  map.get(unsubscribeKey)?.();
}
