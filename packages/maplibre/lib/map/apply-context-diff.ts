import { MapContextDiff, MapContextLayer } from "@geospatial-sdk/core";
import type { Map } from "maplibre-gl";
import { createLayer } from "./create-map.js";
import {
  canDoIncrementalUpdate,
  getFirstLayerIdAtPosition,
  getLayersAtPosition,
  getLayersFromContextLayer,
  updateLayerProperties,
} from "../helpers/map.helpers.js";

/**
 * This will either update the layers in the map or recreate them;
 * the returned promise resolves when the update is done
 * @param map
 * @param layerModel
 * @param previousLayerModel
 * @param layerPosition
 */
export async function updateLayerInMap(
  map: Map,
  layerModel: MapContextLayer,
  previousLayerModel: MapContextLayer,
  layerPosition: number,
): Promise<void> {
  // if an incremental update is possible, do it to avoid costly layer recreation
  if (canDoIncrementalUpdate(previousLayerModel, layerModel)) {
    // we can find the existing layers by using the hash or id of the layerModel
    const mlUpdatedLayers = getLayersFromContextLayer(map, layerModel);
    for (const layer of mlUpdatedLayers) {
      updateLayerProperties(map, layer, layerModel, previousLayerModel);
    }
    return;
  }

  const mlLayersToRemove = getLayersAtPosition(map, layerPosition);
  const sourcesToRemove: string[] = [];
  for (const layer of mlLayersToRemove) {
    if (layer.source && !sourcesToRemove.includes(layer.source)) {
      sourcesToRemove.push(layer.source);
    }
    map.removeLayer(layer.id);
  }
  for (const sourceId of sourcesToRemove) {
    map.removeSource(sourceId);
  }
  const styleDiff = await createLayer(layerModel);
  if (!styleDiff) return;
  const beforeId = getFirstLayerIdAtPosition(map, layerPosition);
  Object.keys(styleDiff.sources).forEach((sourceId) =>
    map.addSource(sourceId, styleDiff.sources[sourceId]),
  );
  styleDiff.layers.map((layer) => {
    map.addLayer(layer, beforeId);
  });
}

/**
 * Apply a context diff to an MapLibre map
 * @param map
 * @param contextDiff
 */
export async function applyContextDiffToMap(
  map: Map,
  contextDiff: MapContextDiff,
): Promise<Map> {
  // removed layers (sorted by descending position)
  if (contextDiff.layersRemoved.length > 0) {
    const removed = contextDiff.layersRemoved.sort(
      (a, b) => b.position - a.position,
    );
    for (const layerRemoved of removed) {
      const mlLayers = getLayersFromContextLayer(map, layerRemoved.layer);
      if (mlLayers.length === 0) {
        console.warn(
          `[Warning] applyContextDiffToMap: no layer found at position ${layerRemoved.position} to remove.`,
        );
        continue;
      }
      const sourceId = mlLayers[0].source;
      mlLayers.forEach((layer) => {
        map.removeLayer(layer.id);
      });
      map.removeSource(sourceId);
    }
  }

  // insert added layers
  const newLayers = await Promise.all(
    contextDiff.layersAdded.map((layerAdded) => createLayer(layerAdded.layer)),
  );
  newLayers.forEach((style, index) => {
    if (!style) return;
    const position = contextDiff.layersAdded[index].position;
    const beforeId = getFirstLayerIdAtPosition(map, position);
    Object.keys(style.sources).forEach((sourceId) =>
      map.addSource(sourceId, style.sources[sourceId]),
    );
    style.layers.map((layer) => {
      map.addLayer(layer, beforeId);
    });
  });

  // handle reordered layers (sorted by ascending new position)
  if (contextDiff.layersReordered.length > 0) {
    const reordered = contextDiff.layersReordered.sort(
      (a, b) => a.newPosition - b.newPosition,
    );

    // collect all layers to be moved
    const mlLayersToMove = reordered.map((layerReordered) =>
      getLayersFromContextLayer(map, layerReordered.layer),
    );

    // move layers & reassign sourcePosition metadata
    for (let i = 0; i < reordered.length; i++) {
      // for (const layerReordered of reordered) {
      const layerReordered = reordered[i];
      const mlLayers = mlLayersToMove[i];
      const beforeId = getFirstLayerIdAtPosition(
        map,
        layerReordered.newPosition + 1,
      );

      if (mlLayers[0].id === beforeId) {
        // layer is already at the right position
        continue;
      }

      // then we add the moved the layer to its new position
      for (const layer of mlLayers) {
        map.moveLayer(layer.id, beforeId);
      }
    }
  }

  // recreate changed layers
  for (const layerChanged of contextDiff.layersChanged) {
    const { layer, previousLayer, position } = layerChanged;
    await updateLayerInMap(map, layer, previousLayer, position);
  }

  if (typeof contextDiff.viewChanges !== "undefined") {
    const { viewChanges } = contextDiff;

    if (viewChanges && "extent" in viewChanges) {
      const { extent } = viewChanges;

      map.fitBounds(
        [
          [extent[0], extent[1]],
          [extent[2], extent[3]],
        ],
        {
          padding: 20,
          duration: 1000,
        },
      );
    }
  }

  return map;
}
