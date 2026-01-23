import { MapContextDiff } from "@geospatial-sdk/core";
import type { Map } from "maplibre-gl";
import { createLayer } from "./create-map.js";
import {
  generateLayerId,
  getBeforeId,
  getLayersFromContextLayer,
  removeLayersFromSource,
} from "../helpers/map.helpers.js";

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
    const beforeId = getBeforeId(map, position);
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
      const beforeId = getBeforeId(map, layerReordered.newPosition);

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
  const changedPromises: Promise<void>[] = [];
  for (const layerChanged of contextDiff.layersChanged) {
    const { layer, position } = layerChanged;
    const beforeId = getBeforeId(map, position);
    const sourceId = generateLayerId(layer);
    removeLayersFromSource(map, sourceId);
    changedPromises.push(
      createLayer(layer).then((styleDiff) => {
        if (!styleDiff) return;
        styleDiff.layers.map((layer) => {
          map.addLayer(layer, beforeId);
        });
      }),
    );
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

  // wait for all layers to be added
  await Promise.all(changedPromises);
  return map;
}
