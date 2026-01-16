import { MapContext, MapContextLayer } from "../model/index.js";
import { isLayerSame, updateLayer } from "./map-context-layer.js";

export function getLayerPosition(
  context: MapContext,
  layerModel: MapContextLayer,
): number {
  return context.layers.findIndex((l) => isLayerSame(layerModel, l));
}

/**
 * Adds a layer to the context at a specific position or at the end if no position is specified.
 *
 * @param context The current map context.
 * @param layerModel The layer to be added.
 * @param [position] The position at which to add the layer. If not specified, the layer is added at the end.
 * @returns The new map context with the added layer.
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
 * @param context The current map context.
 * @param layerModel The layer to be removed.
 * @returns The new map context without the removed layer.
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
 * @param context The current map context.
 * @param layerModel The layer to be replaced.
 * @param replacement The new layer that will replace the old one.
 * @returns The new map context with the replaced layer.
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
 * Replaces a layer in the context with a new layer.
 *
 * @param context The current map context.
 * @param layerModel The layer to be replaced.
 * @param layerUpdates The new layer that will replace the old one.
 * @returns The new map context with the updated layer.
 */

export function updateLayerInContext(
  context: MapContext,
  layerModel: MapContextLayer,
  layerUpdates: Partial<MapContextLayer>,
): MapContext {
  const position = getLayerPosition(context, layerModel);
  if (position >= 0) {
    const existing = context.layers[getLayerPosition(context, layerModel)];
    const updated = updateLayer(existing, layerUpdates);
    return replaceLayerInContext(context, layerModel, updated);
  }
  // we're building a new context so that the reference is changed anyway; this is done to be
  // consistent with other utilities that always change the context reference even if the layer wasn't found
  return { ...context };
}

/**
 * Changes the position of a layer in the context.
 *
 * @param context The current map context.
 * @param layerModel The layer whose position is to be changed.
 * @param position The new position for the layer.
 * @returns The new map context with the layer moved to the new position.
 */

export function changeLayerPositionInContext(
  context: MapContext,
  layerModel: MapContextLayer,
  position: number,
): MapContext {
  const newContext = removeLayerFromContext(context, layerModel);
  return addLayerToContext(newContext, layerModel, position);
}
