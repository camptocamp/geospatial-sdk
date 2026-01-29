import { getHash, MapContextLayer } from "@geospatial-sdk/core";
import {
  MapContextBaseLayer,
  MapContextLayerVector,
} from "@geospatial-sdk/core/lib/model/map-context.js";
import Layer from "ol/layer/Layer.js";
import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";
import VectorLayer from "ol/layer/Vector.js";

const UPDATABLE_PROPERTIES: (
  | keyof MapContextBaseLayer
  | keyof MapContextLayerVector
)[] = [
  "opacity",
  "visibility",
  "label",
  "attributions",
  "extras",
  "version",
  "disableHover",
  "style",
  // TODO (when available) "zIndex"
];

/**
 * Incremental update is possible only if certain properties are changed: opacity,
 * visibility, zIndex, etc.
 *
 * Note: we assume that both layers are different versions of the same layer (this
 * will not be checked again)
 * @param oldLayer
 * @param newLayer
 * @return Returns `true` if the only properties changed are the updatable ones
 */
export function canDoIncrementalUpdate(
  oldLayer: MapContextLayer,
  newLayer: MapContextLayer,
): boolean {
  const oldHash = getHash(oldLayer, UPDATABLE_PROPERTIES);
  const newHash = getHash(newLayer, UPDATABLE_PROPERTIES);
  return oldHash === newHash;
}

/**
 * Will apply generic properties to the layer; if a previous layer model is provided,
 * only changed properties will be updated (to avoid costly change events in OpenLayers)
 * @param layerModel
 * @param olLayer
 * @param previousLayerModel
 */
export function updateLayerProperties(
  layerModel: MapContextLayer,
  olLayer: Layer,
  previousLayerModel?: MapContextLayer,
) {
  function shouldApplyProperty(prop: keyof MapContextLayer): boolean {
    // if the new layer model does not define that property, skip it
    // (setting or resetting it to a default value would be counter-intuitive)
    if (!(prop in layerModel) || typeof layerModel[prop] === "undefined")
      return false;

    // if a previous model is provided and the value did not change in the new layer model, skip it
    if (previousLayerModel && layerModel[prop] === previousLayerModel[prop]) {
      return false;
    }

    // any other case: apply the property
    return true;
  }
  if (shouldApplyProperty("visibility")) {
    olLayer.setVisible(layerModel.visibility!);
  }
  if (shouldApplyProperty("opacity")) {
    olLayer.setOpacity(layerModel.opacity!);
  }
  if (shouldApplyProperty("attributions")) {
    olLayer.getSource()?.setAttributions(layerModel.attributions);
  }
  if (shouldApplyProperty("label")) {
    olLayer.set("label", layerModel.label);
  }
  if (shouldApplyProperty("disableHover" as keyof MapContextLayer)) {
    olLayer.set(
      `${GEOSPATIAL_SDK_PREFIX}disable-hover`,
      (layerModel as MapContextLayerVector).disableHover,
    );
  }
  if (shouldApplyProperty("style" as keyof MapContextLayer)) {
    (olLayer as VectorLayer).setStyle(
      (layerModel as MapContextLayerVector).style,
    );
  }
  // TODO: z-index
}
