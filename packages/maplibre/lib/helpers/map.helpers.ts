import type { LayerSpecification, Map, StyleSpecification } from "maplibre-gl";
import {
  Dataset,
  LayerContextWithStyle,
  LayerMetadataSpecification,
  LayerSpecificationWithSource,
} from "../maplibre.models.js";
import { FeatureCollection, Geometry } from "geojson";
import { contextStyleToMaplibreLayers } from "./style.helpers.js";
import { getHash } from "@geospatial-sdk/core/dist/utils/hash.js";
import { MapContextBaseLayer, MapContextLayer } from "@geospatial-sdk/core";

function getOpacityPaintPropNames(layerType: string): string[] {
  switch (layerType) {
    case "circle":
      return ["circle-opacity", "circle-stroke-opacity"];
    default:
      return [`${layerType}-opacity`];
  }
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
  const sourceId = generateLayerId();
  const partialLayers = contextStyleToMaplibreLayers(layerModel.style);
  const layers = partialLayers.map((layer) => ({
    ...layer,
    id: `${sourceId}-${layer.type}`,
    source: sourceId,
    paint: {
      ...layer.paint,
      ...getOpacityPaintPropNames(layer.type!).reduce(
        (acc, prop) => ({
          ...acc,
          [prop]: layerModel.opacity ?? 1,
        }),
        {},
      ),
    },
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
  const layerHash = generateLayerHashWithoutUpdatableProps(layerModel);

  const layers = map.getStyle().layers;
  const result: LayerSpecificationWithSource[] = [];
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const metadata = layer.metadata as LayerMetadataSpecification | undefined;
    if (layerId !== undefined) {
      if (metadata?.layerId === layerId) {
        result.push(layer as LayerSpecificationWithSource);
      }
    } else if (metadata?.layerHash === layerHash) {
      result.push(layer as LayerSpecificationWithSource);
    }
  }
  return result;
}

/**
 * This returns all MapLibre layers that correspond to a position in a MapContext
 * @param map
 * @param position
 */
export function getLayersAtPosition(
  map: Map,
  position: number,
): LayerSpecificationWithSource[] {
  let layerId = undefined;
  let layerHash = undefined;
  const result: LayerSpecificationWithSource[] = [];

  const layers = map.getStyle().layers;
  let currentPosition = -1;
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i] as LayerSpecificationWithSource;
    const metadata = layer.metadata as LayerMetadataSpecification | undefined;
    if (metadata?.layerId !== layerId || metadata?.layerHash !== layerHash) {
      currentPosition++;
      layerId = metadata?.layerId;
      layerHash = metadata?.layerHash;
    }
    if (currentPosition === position) {
      result.push(layer);
    }
  }
  return result;
}

/**
 * This returns the id of the first MapLibre layer that corresponds to the given MapContext position;
 * used as a beforeId for adding/moving layers
 * @param map
 * @param position
 */
export function getFirstLayerIdAtPosition(
  map: Map,
  position: number,
): string | undefined {
  let layerId = undefined;
  let layerHash = undefined;

  const layers = map.getStyle().layers;
  let currentPosition = -1;
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const metadata = layer.metadata as LayerMetadataSpecification | undefined;
    if (metadata?.layerId !== layerId || metadata?.layerHash !== layerHash) {
      currentPosition++;
      if (currentPosition === position) {
        return layer.id;
      }

      layerId = metadata?.layerId;
      layerHash = metadata?.layerHash;
    }
  }
  return undefined;
}

const UPDATABLE_PROPERTIES: (keyof MapContextBaseLayer)[] = [
  "opacity",
  "visibility",
  "label",
  "extras",
  "version",
  // "attributions", // currently, updating the attribution means recreating the source & layer
  // TODO (when available) "zIndex"
];

/**
 * Incremental update is possible only if certain properties are changed: opacity,
 * visibility, zIndex, etc.
 *
 * Note: we assume that both layers are different versions of the same layer (this
 * will not be checked again)
 * @param oldLayer
 * @param newLayer
 * @return Returns `true` if the only properties changed are the updatable ones
 */
export function canDoIncrementalUpdate(
  oldLayer: MapContextLayer,
  newLayer: MapContextLayer,
): boolean {
  const oldHash = getHash(oldLayer, UPDATABLE_PROPERTIES);
  const newHash = getHash(newLayer, UPDATABLE_PROPERTIES);
  return oldHash === newHash;
}

/**
 * This simply generates a unique id
 */
export function generateLayerId() {
  return Math.floor(Math.random() * 1000000).toString(10);
}

/**
 * This generates a layer hash that stays consistent even if updatable properties change.
 * @param layerModel
 */
export function generateLayerHashWithoutUpdatableProps(
  layerModel: MapContextLayer,
) {
  return getHash(layerModel, UPDATABLE_PROPERTIES);
}

/**
 * Will apply generic properties to the layer; if a previous layer model is provided,
 * only changed properties will be updated (to avoid costly change events in OpenLayers)
 * @param map
 * @param layer
 * @param layerModel
 * @param previousLayerModel
 */
export function updateLayerProperties(
  map: Map,
  layer: LayerSpecification,
  layerModel: MapContextLayer,
  previousLayerModel?: MapContextLayer,
) {
  function shouldApplyProperty(prop: keyof MapContextBaseLayer): boolean {
    // if the new layer model does not define that property, skip it
    // (setting or resetting it to a default value would be counter-intuitive)
    if (!(prop in layerModel) || typeof layerModel[prop] === "undefined")
      return false;

    // if a previous model is provided and the value did not change in the new layer model, skip it
    if (previousLayerModel && layerModel[prop] === previousLayerModel[prop]) {
      return false;
    }

    // any other case: apply the property
    return true;
  }
  const layerId = layer.id;
  const layerType = layer.type;
  if (shouldApplyProperty("visibility")) {
    map.setLayoutProperty(
      layerId,
      "visibility",
      layerModel.visibility === false ? "none" : "visible",
    );
  }
  if (shouldApplyProperty("opacity")) {
    getOpacityPaintPropNames(layerType).forEach((paintProp) => {
      map.setPaintProperty(layerId, paintProp, layerModel.opacity ?? 1);
    });
  }
  // TODO: z-index
}
