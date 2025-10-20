import { Map, StyleSpecification } from "maplibre-gl";
import {
  Dataset,
  LayerContextWithStyle,
  LayerSpecificationWithSource,
} from "../maplibre.models";
import { FeatureCollection, Geometry } from "geojson";
import { contextStyleToMaplibreLayers } from "./style.helpers";

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
 */
export function createDatasetFromGeoJsonLayer(
  layerModel: LayerContextWithStyle,
  geojson: FeatureCollection<Geometry | null>,
): Dataset {
  const sourceId =
    layerModel.id || Math.floor(Math.random() * 1000000).toString();

  const partialLayers = contextStyleToMaplibreLayers(layerModel.style);
  const layers = partialLayers.map((layer) => ({
    ...layer,
    id: `${sourceId}-${layer.type}`,
    source: sourceId,
    layout: {
      visibility: layerModel.visibility === false ? "none" : "visible",
    },
  }));
  const dataset = {
    sources: {
      [sourceId]: {
        type: "geojson",
        data: geojson,
      },
    },
    layers,
  } as StyleSpecification;
  return dataset;
}
