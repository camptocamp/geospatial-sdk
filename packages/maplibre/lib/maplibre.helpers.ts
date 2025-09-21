import { Feature, FeatureCollection, Geometry } from "geojson";
import { LayerSpecification, StyleSpecification } from "maplibre-gl";
import {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
} from "@maplibre/maplibre-gl-style-spec";

export function getGeometryTypes(features: Feature<Geometry>[]): string[] {
  return features.reduce((types: string[], feature) => {
    const type = feature.geometry?.type.toLocaleLowerCase();
    if (type && !types.includes(type)) {
      types.push(type);
    }
    return types;
  }, []);
}

export function createDefaultLayersForGeometries(
  layerId: string,
  sourceId: string,
  geometryTypes: string[],
): LayerSpecification[] {
  const layers = [];
  if (
    geometryTypes.includes("polygon") ||
    geometryTypes.includes("multipolygon")
  ) {
    layers.push(createDefaultFillLayer(layerId, sourceId));
  }
  if (geometryTypes.includes("point") || geometryTypes.includes("multipoint")) {
    layers.push(createDefaultCircleLayer(layerId, sourceId));
  }
  if (
    geometryTypes.includes("linestring") ||
    geometryTypes.includes("multilinestring")
  ) {
    layers.push(createDefaultLineLayer(layerId, sourceId));
  }
  return layers;
}

export function createDefaultFillLayer(
  layerId: string,
  sourceId: string,
): FillLayerSpecification {
  return {
    id: `${layerId}-fill`,
    type: "fill",
    source: sourceId,
    paint: {
      "fill-color": "#68C6DE",
      "fill-opacity": 0.6,
    },
  };
}
export function createDefaultCircleLayer(
  layerId: string,
  sourceId: string,
): CircleLayerSpecification {
  return {
    id: `${layerId}-circle`,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 4, 13, 15],
      "circle-color": "#60759F",
      "circle-opacity": 0.59,
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "#4E8BD4",
    },
  };
}

export function createDefaultLineLayer(
  layerId: string,
  sourceId: string,
): LineLayerSpecification {
  return {
    id: `${layerId}-line`,
    type: "line",
    source: sourceId,
    paint: {
      "line-color": "green",
      "line-width": 3,
    },
  };
}

export function createStyleFromGeoJson(
  datasetId: string,
  geojson: FeatureCollection,
): StyleSpecification {
  datasetId = datasetId || Math.floor(Math.random() * 1000000).toString();
  const sourceId = `source-${datasetId}`;
  const layerId = `layer-${datasetId}`;
  const geometryTypes = getGeometryTypes(geojson!.features as Feature[]);
  const layers = createDefaultLayersForGeometries(
    layerId,
    sourceId,
    geometryTypes,
  );
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
