import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";
import type OlMap from "ol/Map.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import { defaultHighlightStyle } from "@geospatial-sdk/core";
import { MapBrowserEvent } from "ol";
import OlFeature from "ol/Feature.js";
import type BaseLayer from "ol/layer/Base.js";
import { unByKey } from "ol/Observable.js";

const selectionLayerKey = `${GEOSPATIAL_SDK_PREFIX}selection-layer`;
const unsubscribeKey = `${GEOSPATIAL_SDK_PREFIX}selection-unsub`;

export function initSelectionLayer(map: OlMap) {
  if (map.get(selectionLayerKey)) {
    clearSelectionLayer(map);
  }

  // create layer & add on top of everything else
  const selectionLayer = new VectorLayer({
    source: new VectorSource({
      features: [],
      useSpatialIndex: false,
    }),
    style: defaultHighlightStyle,
  });
  map.set(selectionLayerKey, selectionLayer);
  selectionLayer.setMap(map);

  const layerFilter = (layer: BaseLayer) =>
    layer !== selectionLayer &&
    layer.get(`${GEOSPATIAL_SDK_PREFIX}enable-selection`);

  const unKey = map.on(
    "click",
    async (event: MapBrowserEvent<PointerEvent>) => {
      const selectedSource = selectionLayer.getSource() as VectorSource;
      selectedSource.clear(true);

      // Check if there's a feature at the clicked pixel
      const hasFeature = map.hasFeatureAtPixel(event.pixel, {
        layerFilter,
      });
      if (!hasFeature) {
        return;
      }

      // Find the selected feature and its source layer
      const selectedFeatureResult: {
        feature: OlFeature;
        layer: BaseLayer;
      }[] = [];
      map.forEachFeatureAtPixel(
        event.pixel,
        (feature, layer) => {
          if (feature instanceof OlFeature) {
            selectedFeatureResult.push({ feature, layer });
            return true;
          }
        },
        {
          layerFilter,
        },
      );
      if (selectedFeatureResult.length === 0) {
        return;
      }

      const { feature: firstFeature, layer: sourceLayer } =
        selectedFeatureResult[0];

      // Get the selectedStyle from the source layer, fallback to defaultHighlightStyle
      const selectedStyle =
        sourceLayer.get(`${GEOSPATIAL_SDK_PREFIX}selected-style`) ??
        defaultHighlightStyle;

      // Apply the selected style to the layer (FlatStyleLike works on layers, not features)
      selectionLayer.setStyle(selectedStyle);
      selectedSource.addFeature(firstFeature);
    },
  );
  map.set(unsubscribeKey, unKey);
}

export function getSelectionLayer(map: OlMap): VectorLayer<VectorSource> {
  return map.get(selectionLayerKey) as VectorLayer<VectorSource>;
}

export function clearSelectionLayer(map: OlMap) {
  const selectionLayer = getSelectionLayer(map);
  selectionLayer.setMap(null);
  selectionLayer.dispose();
  map.set(selectionLayerKey, null);
  unByKey(map.get(unsubscribeKey));
}

export function clearSelection(map: OlMap) {
  const selectionLayer = getSelectionLayer(map);
  if (selectionLayer) {
    const source = selectionLayer.getSource();
    if (source) {
      source.clear(true);
    }
  }
}
