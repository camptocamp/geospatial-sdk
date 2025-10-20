import { MapContextDiff } from "@geospatial-sdk/core";
import { Map } from "maplibre-gl";
import { createLayer } from "./create-map";
import { removeLayersFromSource } from "../helpers/map.helpers";

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
      const maplibreLayer = map.getStyle().layers[layerRemoved.position];
      if (maplibreLayer.type === "background") {
        console.warn(
          "[Warning] applyContextDiffToMap: removing background layer is not supported.",
        );
        continue;
      }
      const sourceId = maplibreLayer.source;
      map.removeLayer(maplibreLayer.id);
      map.removeSource(sourceId);
    }
  }

  // insert added layers
  const newLayers = await Promise.all(
    contextDiff.layersAdded.map((layerAdded) => createLayer(layerAdded.layer)),
  );
  newLayers.forEach((style, index) => {
    const position = contextDiff.layersAdded[index].position;
    const beforeId = map.getLayersOrder()[position]; // can be undefined
    Object.keys(style.sources).forEach((sourceId) =>
      map.addSource(sourceId, style.sources[sourceId]),
    );
    style.layers.map((layer) => {
      if (position >= map.getLayersOrder().length) {
        map.addLayer(layer);
      } else {
        map.addLayer(layer, beforeId);
      }
    });
  });

  // recreate changed layers
  for (const layerChanged of contextDiff.layersChanged) {
    const sourceId = layerChanged.layer.id as string;
    removeLayersFromSource(map, sourceId);
    createLayer(layerChanged.layer).then((styleDiff) => {
      styleDiff.layers.map((layer) => map.addLayer(layer));
    });
  }
}
