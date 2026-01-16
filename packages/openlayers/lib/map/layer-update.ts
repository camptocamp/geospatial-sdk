import { getHash, MapContextLayer } from "@geospatial-sdk/core";
import { MapContextBaseLayer } from "@geospatial-sdk/core/lib/model/map-context.js";

const UPDATABLE_PROPERTIES: (keyof MapContextBaseLayer)[] = [
  "opacity",
  "visibility",
  "label",
  "attributions",
  "extras",
  "version",
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
