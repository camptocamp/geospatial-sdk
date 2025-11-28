import { MapContextDiff } from "@geospatial-sdk/core";
import { Map } from "maplibre-gl";
import { createLayer } from "./create-map";
import {
  generateLayerId,
  getBeforeId,
  getLayersAtPosition,
  removeLayersFromSource,
} from "../helpers/map.helpers";

/**
 * Apply a context diff to an MapLibre map
 * @param map
 * @param contextDiff
 */
export async function applyContextDiffToMap(
  map: Map,
  contextDiff: MapContextDiff,
): Promise<void> {
  // removed layers (sorted by descending position)
  if (contextDiff.layersRemoved.length > 0) {
    const removed = contextDiff.layersRemoved.sort(
      (a, b) => b.position - a.position,
    );
    for (const layerRemoved of removed) {
      const mlLayers = getLayersAtPosition(map, layerRemoved.position);
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
    contextDiff.layersAdded.map((layerAdded) =>
      createLayer(layerAdded.layer, layerAdded.position),
    ),
  );
  newLayers.forEach((style, index) => {
    const position = contextDiff.layersAdded[index].position;
    let beforeId = getBeforeId(map, position);
    Object.keys(style.sources).forEach((sourceId) =>
      map.addSource(sourceId, style.sources[sourceId]),
    );
    style.layers.map((layer) => {
      map.addLayer(layer, beforeId);
    });
  });

  // recreate changed layers
  for (const layerChanged of contextDiff.layersChanged) {
    const { layer, position } = layerChanged;
    const sourceId = generateLayerId(layer);
    removeLayersFromSource(map, sourceId);
    let beforeId = getBeforeId(map, position);
    createLayer(layer, position).then((styleDiff) => {
      styleDiff.layers.map((layer) => {
        map.addLayer(layer, beforeId);
      });
    });
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
}
