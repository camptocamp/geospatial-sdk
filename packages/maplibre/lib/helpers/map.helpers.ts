import { Map, StyleSpecification } from "maplibre-gl";
import {
  Dataset,
  LayerContextWithStyle,
  LayerMetadataSpecification,
  LayerSpecificationWithSource,
} from "../maplibre.models.js";
import { FeatureCollection, Geometry } from "geojson";
import { contextStyleToMaplibreLayers } from "./style.helpers.js";
import { getHash } from "@geospatial-sdk/core/dist/utils/hash.js";
import { MapContextLayer } from "@geospatial-sdk/core";
import { getLayerHash } from "@geospatial-sdk/core/dist/utils/map-context-layer.js";

/**
 * Remove all layers from a given source in the map.
 * @param map
 * @param sourceId
 */
export function removeLayersFromSource(map: Map, sourceId: string) {
  const layers = map.getStyle().layers;
  const layersWithSource = layers.filter(
    (layer) => layer.type !== "background",
  ) as LayerSpecificationWithSource[];
  const layerIds = layersWithSource
    .filter(
      (layer) => layer.hasOwnProperty("source") && layer.source === sourceId,
    )
    .map((layer) => layer.id);
  layerIds.forEach((layer) => map.removeLayer(layer));
}

/**
 * Create a Maplibre source and layers from a GeoJSON MapContextLayer and its style.
 * @param layerModel
 * @param geojson
 * @param metadata
 */
export function createDatasetFromGeoJsonLayer(
  layerModel: LayerContextWithStyle,
  geojson: FeatureCollection<Geometry | null> | string,
  metadata: LayerMetadataSpecification,
): Dataset {
  const sourceId = generateLayerId(layerModel);
  const partialLayers = contextStyleToMaplibreLayers(layerModel.style);
  const layers = partialLayers.map((layer) => ({
    ...layer,
    id: `${sourceId}-${layer.type}`,
    source: sourceId,
    layout: {
      visibility: layerModel.visibility === false ? "none" : "visible",
    },
    metadata,
  }));
  return {
    sources: {
      [sourceId]: {
        type: "geojson",
        data: geojson,
      },
    },
    layers,
  } as StyleSpecification;
}

export function getLayersFromContextLayer(
  map: Map,
  layerModel: MapContextLayer,
): LayerSpecificationWithSource[] {
  const layerId = layerModel.id;
  const layerHash = getLayerHash(layerModel);

  const layers = map.getStyle().layers;
  const result: LayerSpecificationWithSource[] = [];
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const metadata = layer.metadata as LayerMetadataSpecification;
    if (layerId !== undefined) {
      if (metadata.layerId === layerId) {
        result.push(layer as LayerSpecificationWithSource);
      }
    } else if (metadata.layerHash === layerHash) {
      result.push(layer as LayerSpecificationWithSource);
    }
  }
  return result;
}

/**
 * This returns the id before which a MapLibre layer should be added/moved, in order for the
 * layer to end up at the specified position.
 * @param map
 * @param position
 */
export function getBeforeId(map: Map, position: number): string | undefined {
  let layerId = undefined;
  let layerHash = undefined;

  const layers = map.getStyle().layers;
  let currentPosition = -1;
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const metadata = layer.metadata as LayerMetadataSpecification;
    if (metadata.layerId !== layerId || metadata.layerHash !== layerHash) {
      currentPosition++;
      if (currentPosition === position + 1) {
        return layer.id;
      }

      layerId = metadata.layerId;
      layerHash = metadata.layerHash;
    }
  }
  return undefined;
}

export function generateLayerId(layerModel: MapContextLayer) {
  return getHash(layerModel, [
    "name",
    "style",
    "visibility",
    "opacity",
    "version",
    "extras",
  ]);
}
