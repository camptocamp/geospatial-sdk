import { Map, StyleSpecification } from "maplibre-gl";
import {
  Dataset,
  LayerContextWithStyle,
  LayerMetadataSpecification,
  LayerSpecificationWithSource,
} from "../maplibre.models";
import { FeatureCollection, Geometry } from "geojson";
import { contextStyleToMaplibreLayers } from "./style.helpers";
import { getHash } from "@geospatial-sdk/core/dist/utils/hash";
import { MapContextLayer } from "@geospatial-sdk/core";

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
 * @param sourcePosition
 */
export function createDatasetFromGeoJsonLayer(
  layerModel: LayerContextWithStyle,
  geojson: FeatureCollection<Geometry | null> | string,
  sourcePosition: number,
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
    metadata: {
      sourcePosition,
    },
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

export function getLayersAtPosition(
  map: Map,
  position: number,
): LayerSpecificationWithSource[] {
  const layers = map.getStyle().layers;
  const layersWithSource = layers.filter(
    (layer) => layer.type !== "background", //TODO background layers is not managed
  ) as LayerSpecificationWithSource[];
  return layersWithSource.filter(
    (layer) =>
      (layer.metadata as LayerMetadataSpecification)?.sourcePosition ===
      position,
  );
}

export function getBeforeId(map: Map, position: number): string | undefined {
  const beforeLayer = map
    .getStyle()
    .layers.find(
      (layer) =>
        (layer.metadata as LayerMetadataSpecification).sourcePosition ===
        position + 1,
    );
  return beforeLayer ? beforeLayer.id : undefined;
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
