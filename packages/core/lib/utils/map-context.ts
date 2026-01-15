import { MapContext, MapContextLayer } from "../model/index.js";
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

export function getLayerPosition(
  context: MapContext,
  layerModel: MapContextLayer,
): number {
  return context.layers.findIndex((l) => isLayerSame(layerModel, l));
}

/**
 * Adds a layer to the context at a specific position or at the end if no position is specified.
 *
 * @param {MapContext} context - The current map context.
 * @param {MapContextLayer} layerModel - The layer to be added.
 * @param {number} [position] - The position at which to add the layer. If not specified, the layer is added at the end.
 * @returns {MapContext} - The new map context with the added layer.
 */

export function addLayerToContext(
  context: MapContext,
  layerModel: MapContextLayer,
  position?: number,
): MapContext {
  const newContext = { ...context, layers: [...context.layers] };
  if (position !== undefined) {
    newContext.layers.splice(position, 0, layerModel);
  } else {
    newContext.layers.push(layerModel);
  }
  return newContext;
}

/**
 * Removes a layer from the context.
 *
 * @param {MapContext} context - The current map context.
 * @param {MapContextLayer} layerModel - The layer to be removed.
 * @returns {MapContext} - The new map context without the removed layer.
 */

export function removeLayerFromContext(
  context: MapContext,
  layerModel: MapContextLayer,
): MapContext {
  const newContext = { ...context, layers: [...context.layers] };
  const position = getLayerPosition(context, layerModel);
  if (position >= 0) {
    newContext.layers.splice(position, 1);
  }
  return newContext;
}

/**
 * Replaces a layer in the context with a new layer.
 *
 * @param {MapContext} context - The current map context.
 * @param {MapContextLayer} layerModel - The layer to be replaced.
 * @param {MapContextLayer} replacement - The new layer that will replace the old one.
 * @returns {MapContext} - The new map context with the replaced layer.
 */

export function replaceLayerInContext(
  context: MapContext,
  layerModel: MapContextLayer,
  replacement: MapContextLayer,
): MapContext {
  const newContext = { ...context, layers: [...context.layers] };
  const position = getLayerPosition(context, layerModel);
  if (position >= 0) {
    newContext.layers.splice(position, 1, replacement);
  }
  return newContext;
}

/**
 * Changes the position of a layer in the context.
 *
 * @param {MapContext} context - The current map context.
 * @param {MapContextLayer} layerModel - The layer whose position is to be changed.
 * @param {number} position - The new position for the layer.
 * @returns {MapContext} - The new map context with the layer moved to the new position.
 */

export function changeLayerPositionInContext(
  context: MapContext,
  layerModel: MapContextLayer,
  position: number,
): MapContext {
  const newContext = removeLayerFromContext(context, layerModel);
  return addLayerToContext(newContext, layerModel, position);
}
