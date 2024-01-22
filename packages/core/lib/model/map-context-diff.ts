import { MapContextLayer, MapContextView } from "./map-context";

/**
 * Associates a position to a layer; the position is the index of
 * the layer in the layers array
 */
export type MapContextLayerPositioned = {
  layer: MapContextLayer;
  position: number;
};

/**
 * Describes a layer being moved to a different position
 */
export type MapContextLayerReordered = {
  layer: MapContextLayer;
  newPosition: number;
  previousPosition: number;
};

/**
 * Describes a delta between two contexts, in order to be
 * applied to an existing map.
 *
 * For positions to be correct the order of operations should be:
 * 1. change layers
 * 2. remove layers
 * 3. add layers
 * 4. move layers
 */
export interface MapContextDiff {
  layersChanged: MapContextLayerPositioned[];
  layersReordered: MapContextLayerReordered[];
  layersRemoved: MapContextLayerPositioned[];
  layersAdded: MapContextLayerPositioned[];
  viewChanges: MapContextView;
}
