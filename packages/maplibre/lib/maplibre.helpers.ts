import { Feature, FeatureCollection, Geometry } from "geojson";
import { LayerSpecification, StyleSpecification } from "maplibre-gl";
import {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
} from "@maplibre/maplibre-gl-style-spec";
import { contextStyleToMaplibreLayers } from "./helpers/style.helpers";
import { MapContextLayer, MapContextLayerGeojson } from "@geospatial-sdk/core";
import { LayerContextWithStyle } from "./maplibre.models";

/**
 * Get unique geometry types from a list of features, as lowercase strings.
 * @param features
 */
export function getGeometryTypes(features: Feature<Geometry>[]): string[] {
  return features.reduce((types: string[], feature) => {
    const type = feature.geometry?.type.toLocaleLowerCase();
    if (type && !types.includes(type)) {
      types.push(type);
    }
    return types;
  }, []);
}

/**
 * Create a Maplibre StyleSpecification from a GeoJSON MapContextLayer and its style.
 * @param layerModel
 * @param geojson
 */
export function createStyleFromGeoJsonLayer(
  layerModel: LayerContextWithStyle,
  geojson: FeatureCollection<Geometry | null>,
): StyleSpecification {

  const sourceId =  layerModel.id || Math.floor(Math.random() * 1000000).toString();

  const partialLayers =  contextStyleToMaplibreLayers(layerModel.style);
  const layers = partialLayers.map(layer => ({
    ...layer,
     id: `${sourceId}-${layer.type}`,
     source: sourceId,
     layout: {
      visibility: layerModel.visibility === false ? 'none' : 'visible'
     }
  }))
  const styleDiff = {
    sources: {
      [sourceId]: {
        type: "geojson",
        data: geojson,
      },
    },
    layers,
  } as StyleSpecification;
  return styleDiff;
}
