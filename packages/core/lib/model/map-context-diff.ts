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
  layersChanged: MapContextLayerPositioned[];
  layersReordered: MapContextLayerReordered[];
  layersRemoved: MapContextLayerPositioned[];
  layersAdded: MapContextLayerPositioned[];
  viewChanges?: MapContextView | null; // this is both optional (meaning no view change) and nullable (meaning reset to default view)
}
