import { MapContextLayer } from "../model/index.js";
import { getHash } from "./hash.js";

export function getLayerHash(
  layer: MapContextLayer,
  includeExtras = false,
): string {
  return getHash(layer, includeExtras ? [] : ["extras"]);
}

export function isLayerSame(
  layerA: MapContextLayer,
  layerB: MapContextLayer,
): boolean {
  if ("id" in layerA && "id" in layerB) {
    return layerA.id == layerB.id;
  }
  return getLayerHash(layerA) === getLayerHash(layerB);
}

export function isLayerSameAndUnchanged(
  layerA: MapContextLayer,
  layerB: MapContextLayer,
): boolean {
  if (
    "id" in layerA &&
    "id" in layerB &&
    ("version" in layerA || "version" in layerB)
  ) {
    return layerA.id == layerB.id && layerA.version == layerB.version;
  }
  return getLayerHash(layerA, true) === getLayerHash(layerB, true);
}

/**
 * Applies the `updates` partial to the given layer. The layer will also be
 * adjusted depending on the presence of the `id` and `version` fields.
 * Note: any property set to `undefined` in `updates` will be removed from the resulting layer.
 * @param layer
 * @param updates
 */
export function updateLayer(
  layer: MapContextLayer,
  updates: Partial<MapContextLayer>,
): MapContextLayer {
  const updatedLayer: MapContextLayer = {
    ...layer,
    ...updates,
  } as MapContextLayer;
  const versionExplicitlyUpdated =
    "version" in updates && updates.version !== undefined;
  if (
    "id" in updatedLayer &&
    "version" in updatedLayer &&
    typeof updatedLayer.version === "number" &&
    !versionExplicitlyUpdated
  ) {
    updatedLayer.version = updatedLayer.version + 1;
  }
  for (const key in updatedLayer) {
    if (updatedLayer[key as keyof MapContextLayer] === undefined) {
      delete updatedLayer[key as keyof MapContextLayer];
    }
  }
  return updatedLayer;
}
