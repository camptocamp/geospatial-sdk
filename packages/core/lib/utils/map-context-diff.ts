import {
  MapContext,
  MapContextDiff,
  MapContextLayer,
  MapContextLayerPositioned,
  MapContextLayerReordered,
} from "../model/index.js";
import { isLayerSame, isLayerSameAndUnchanged } from "./map-context.js";

/**
 * The following logic is produced by identifying layers in both context
 * and determining whether they have been added, removed, changed or reordered.
 *
 * Identifying layers to determine if they have been added/removed/reordered is done like so:
 * 1. For layers with an `id` property, use non-strict equality on it (e.g. '2' and 2 are equivalent);
 * 2. For layers without `id`, compute a hash of their base properties _excluding the `extras` property_
 *
 * Determining whether layers have changed is done like so:
 * 1. For layers with an `id` property, the value of the `version` field is compared;
 *    if values are different (using non-strict equality), then the layer is considered to have changed; otherwise
 *    it is considered to have remained the same
 * 2. For layers without `id`, a full hash is computed _including the `extras` property_;
 *    this means that a layer which only had changes in its `extras` object will not be considered added/removed,
 *    but only changed
 *
 * @param nextContext
 * @param previousContext
 */
export function computeMapContextDiff(
  nextContext: MapContext,
  previousContext: MapContext,
): MapContextDiff {
  function getLayerPosition(
    layer: MapContextLayer,
    layers: MapContextLayer[],
  ): number {
    for (let i = 0; i < layers.length; i++) {
      if (isLayerSame(layers[i], layer)) {
        return i;
      }
    }
    return -1;
  }

  const layersChanged: MapContextLayerPositioned[] = [];
  const layersReordered: MapContextLayerReordered[] = [];
  const layersRemoved: MapContextLayerPositioned[] = [];
  const layersAdded: MapContextLayerPositioned[] = [];

  // loop on prev context layers (for removed layers)
  for (let i = 0; i < previousContext.layers.length; i++) {
    const layer = previousContext.layers[i];
    const nextPosition = getLayerPosition(layer, nextContext.layers);
    const prevPosition = getLayerPosition(layer, previousContext.layers);
    if (nextPosition === -1) {
      layersRemoved.push({ layer, position: prevPosition });
    }
  }

  // loop on next context layers (for added & updated)
  for (let i = 0; i < nextContext.layers.length; i++) {
    const layer = nextContext.layers[i];
    const prevPosition = getLayerPosition(layer, previousContext.layers);
    if (prevPosition === -1) {
      layersAdded.push({ layer, position: i });
    } else {
      const prevLayer = previousContext.layers[prevPosition];
      if (!isLayerSameAndUnchanged(layer, prevLayer)) {
        layersChanged.push({ layer, position: i });
      }
    }
  }

  // look for moved layers
  const prevLayersFiltered = previousContext.layers.filter(
    (l) => !layersRemoved.find(({ layer }) => l === layer),
  );
  const nextLayersFiltered = nextContext.layers.filter(
    (l) => !layersAdded.find(({ layer }) => l === layer),
  );
  for (let i = 0; i < nextLayersFiltered.length; i++) {
    const layer = nextLayersFiltered[i];
    const prevPosition = getLayerPosition(layer, prevLayersFiltered);
    if (i !== prevPosition) {
      layersReordered.push({
        layer,
        newPosition: getLayerPosition(layer, nextContext.layers),
        previousPosition: getLayerPosition(layer, previousContext.layers),
      });
    }
  }

  let viewChanges =
    nextContext.view !== previousContext.view ? nextContext.view : undefined;
  if (viewChanges !== null && viewChanges !== undefined) {
    viewChanges = { ...viewChanges }; // copy the view to avoid unexpected mutations
  }

  return {
    layersAdded,
    layersChanged,
    layersRemoved,
    layersReordered,
    ...(viewChanges !== undefined && { viewChanges }),
  };
}
