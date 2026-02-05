import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";
import type OlMap from "ol/Map.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import {
  defaultHighlightStyle,
  FeaturesHoverEventType,
} from "@geospatial-sdk/core";
import type BaseEvent from "ol/events/Event.js";
import { MapBrowserEvent } from "ol";
import OlFeature from "ol/Feature.js";
import type BaseLayer from "ol/layer/Base.js";
import { unByKey } from "ol/Observable.js";
import { readFeaturesAtPixel } from "./get-features.js";

const hoverLayerKey = `${GEOSPATIAL_SDK_PREFIX}hover-layer`;
const unsubscribeKey = `${GEOSPATIAL_SDK_PREFIX}hover-unsub`;

export function initHoverLayer(map: OlMap) {
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
    properties: {
      [`${GEOSPATIAL_SDK_PREFIX}enable-hover`]: false,
      [`${GEOSPATIAL_SDK_PREFIX}disable-click`]: true,
    },
  });
  map.set(hoverLayerKey, hoverLayer);
  hoverLayer.setMap(map);

  // store original cursor style in order to change it later
  const originalCursorStyle = map.getTargetElement()?.style.cursor ?? "";

  const layerFilter = (layer: BaseLayer) =>
    layer.get(`${GEOSPATIAL_SDK_PREFIX}enable-hover`);

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
      if (map.getTargetElement()) {
        map.getTargetElement().style.cursor = hasFeature
          ? "pointer"
          : originalCursorStyle;
      }

      const hoveredSource = hoverLayer.getSource() as VectorSource;
      hoveredSource.clear(true);
      if (!hasFeature) {
        return;
      }

      // add hovered feature to the layer
      const hoveredFeatureResult: {
        feature: OlFeature;
        layer: BaseLayer;
      }[] = [];
      map.forEachFeatureAtPixel(
        event.pixel,
        (feature, layer) => {
          if (feature instanceof OlFeature) {
            hoveredFeatureResult.push({ feature, layer });
            return true;
          }
        },
        {
          layerFilter,
        },
      );
      if (hoveredFeatureResult.length === 0) {
        return;
      }

      const { feature: firstFeature, layer: sourceLayer } =
        hoveredFeatureResult[0];

      // Get the hoverStyle from the source layer, fallback to defaultHighlightStyle
      const hoverStyle =
        sourceLayer.get(`${GEOSPATIAL_SDK_PREFIX}hover-style`) ??
        defaultHighlightStyle;

      // Apply the hover style to the layer (FlatStyleLike works on layers, not features)
      hoverLayer.setStyle(hoverStyle);
      hoveredSource.addFeature(firstFeature);

      // dispatch event if subscribed to
      if (map.get(FeaturesHoverEventType)) {
        const featuresByLayer = await readFeaturesAtPixel(
          map,
          event,
          layerFilter,
        );
        const features = Array.from(featuresByLayer.values()).flat();
        map.dispatchEvent({
          type: FeaturesHoverEventType,
          features,
          featuresByLayer,
        } as unknown as BaseEvent);
      }
    },
  );
  map.set(unsubscribeKey, unKey);
}

export function getHoverLayer(map: OlMap): VectorLayer<VectorSource> {
  return map.get(hoverLayerKey) as VectorLayer<VectorSource>;
}

export function clearHoverLayer(map: OlMap) {
  const hoverLayer = getHoverLayer(map);
  hoverLayer.setMap(null);
  hoverLayer.dispose();
  map.set(hoverLayerKey, null);
  unByKey(map.get(unsubscribeKey));
}
