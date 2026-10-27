import { MapContextLayer, MapContextView } from "./map-context.js";

/**
 * Associates a position to a layer; the position is the index of
 * the layer in the layers array
 */
export interface MapContextLayerPositioned {
  layer: MapContextLayer;
  position: number;
}

/**
 * Describes a layer being moved to a different position
 */
export interface MapContextLayerReordered {
  layer: MapContextLayer;
  newPosition: number;
  previousPosition: number;
}

/**
 * Describes a layer that was changed: both states before and after change are included
 */
export interface MapContextLayerChanged {
  layer: MapContextLayer;
  previousLayer: MapContextLayer;
  position: number;
}

/**
 * If the `projection` field is omitted, it means that the view projection should not be changed.
 * A return to the default map view projection should be explicitly stated in the `projection` property.
 * `null` means reset to the default view.
 */
export type MapContextViewDiff = MapContextView | null;

/**
 * Describes a delta between two contexts, in order to be
 * applied to an existing map.
 *
 * For positions to be correct the order of operations should be:
 * 1. remove layers
 * 2. add layers
 * 3. move layers
 * 4. change layers
 */
export interface MapContextDiff {
  layersChanged: MapContextLayerChanged[];
  layersReordered: MapContextLayerReordered[];
  layersRemoved: MapContextLayerPositioned[];
  layersAdded: MapContextLayerPositioned[];
  viewChanges?: MapContextViewDiff; // if this property is omitted, the view hasn't changed
}
