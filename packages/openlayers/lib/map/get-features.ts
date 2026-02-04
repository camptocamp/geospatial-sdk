import type { FeaturesByLayerIndex } from "@geospatial-sdk/core";
import type { Feature, FeatureCollection } from "geojson";
import throttle from "lodash.throttle";
import { Coordinate } from "ol/coordinate.js";
import OlFeature from "ol/Feature.js";
import GeoJSON from "ol/format/GeoJSON.js";
import Layer from "ol/layer/Layer.js";
import OlMap from "ol/Map.js";
import type MapBrowserEvent from "ol/MapBrowserEvent.js";
import { Pixel } from "ol/pixel.js";
import ImageWMS from "ol/source/ImageWMS.js";
import TileWMS from "ol/source/TileWMS.js";

const GEOJSON = new GeoJSON();

export function getFeaturesFromVectorSources(
  olMap: OlMap,
  pixel: Pixel,
  layerFilter?: (layer: Layer) => boolean,
): FeaturesByLayerIndex {
  const result = new Map<number, Feature[]>();
  const layerArray = olMap.getLayers().getArray();
  olMap.forEachFeatureAtPixel(
    pixel,
    (feature, layer) => {
      // can happen for unmanaged layer (i.e. hover layer)
      if (layer === null) {
        return null;
      }
      const layerIndex = layerArray.indexOf(layer);
      if (!result.has(layerIndex)) {
        result.set(layerIndex, []);
      }
      result
        .get(layerIndex)!
        .push(GEOJSON.writeFeatureObject(feature as OlFeature));
    },
    { layerFilter },
  );
  return result;
}

export function getGFIUrl(
  source: TileWMS | ImageWMS,
  map: OlMap,
  coordinate: Coordinate,
): string | null {
  const view = map.getView();
  const projection = view.getProjection();
  const resolution = view.getResolution() as number;
  const params = {
    ...source.getParams(),
    INFO_FORMAT: "application/json",
  };
  return (
    source.getFeatureInfoUrl(coordinate, resolution, projection, params) ?? null
  );
}

export async function getFeaturesFromWmsSources(
  olMap: OlMap,
  coordinate: Coordinate,
  layerFilter?: (layer: Layer) => boolean,
): Promise<FeaturesByLayerIndex> {
  const result = new Map<number, Feature[]>();
  const layerArray = olMap.getLayers().getArray();

  const hasWms = layerArray.some((layer) => {
    const source = layer instanceof Layer ? layer.getSource() : null;
    return source instanceof TileWMS || source instanceof ImageWMS;
  });
  if (!hasWms) {
    return result;
  }

  const gfiPromises: (Promise<Feature[]> | null)[] = layerArray.map((layer) => {
    if (!(layer instanceof Layer)) {
      return null;
    }
    if (layerFilter && !layerFilter(layer)) {
      return null;
    }
    const source = layer.getSource();
    if (!(source instanceof TileWMS) && !(source instanceof ImageWMS)) {
      return null;
    }
    const gfiUrl = getGFIUrl(source, olMap, coordinate);
    return gfiUrl
      ? fetch(gfiUrl)
          .then((response) => response.json())
          .then((collection: FeatureCollection) => collection.features)
      : null;
  });

  const responses = await Promise.all(gfiPromises);
  responses.forEach((features, index) => {
    if (features !== null && features.length > 0) {
      result.set(index, features);
    }
  });
  return result;
}

const getFeaturesFromWmsSourcesThrottled = throttle(
  getFeaturesFromWmsSources,
  250,
);

export async function readFeaturesAtPixel(
  map: OlMap,
  event: MapBrowserEvent<PointerEvent>,
  layerFilter?: (layer: Layer) => boolean,
): Promise<FeaturesByLayerIndex> {
  return new Map([
    ...getFeaturesFromVectorSources(map, event.pixel, layerFilter),
    ...(await getFeaturesFromWmsSourcesThrottled(
      map,
      event.coordinate,
      layerFilter,
    )),
  ]);
}
