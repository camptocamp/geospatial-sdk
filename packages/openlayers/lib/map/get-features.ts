import GeoJSON from "ol/format/GeoJSON.js";
import Map from "ol/Map.js";
import { Pixel } from "ol/pixel.js";
import type { Feature, FeatureCollection } from "geojson";
import OlFeature from "ol/Feature.js";
import TileWMS from "ol/source/TileWMS.js";
import ImageWMS from "ol/source/ImageWMS.js";
import { Coordinate } from "ol/coordinate.js";
import Layer from "ol/layer/Layer.js";
import throttle from "lodash.throttle";
import { MapBrowserEvent } from "ol";

const GEOJSON = new GeoJSON();

export function getFeaturesFromVectorSources(
  olMap: Map,
  pixel: Pixel,
): Feature[] {
  const olFeatures = olMap.getFeaturesAtPixel(pixel);
  const { features } = GEOJSON.writeFeaturesObject(olFeatures as OlFeature[]);
  if (!features) {
    return [];
  }
  return features;
}

export function getGFIUrl(
  source: TileWMS | ImageWMS,
  map: Map,
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

export function getFeaturesFromWmsSources(
  olMap: Map,
  coordinate: Coordinate,
): Promise<Feature[]> {
  const wmsSources: (ImageWMS | TileWMS)[] = olMap
    .getLayers()
    .getArray()
    .filter(
      (layer): layer is Layer<ImageWMS | TileWMS> =>
        layer instanceof Layer &&
        (layer.getSource() instanceof TileWMS ||
          layer.getSource() instanceof ImageWMS),
    )
    .map((layer) => layer.getSource()!);

  if (!wmsSources.length) {
    return Promise.resolve([]);
  }

  const gfiUrls = wmsSources.reduce((urls, source) => {
    const gfiUrl = getGFIUrl(source, olMap, coordinate);
    return gfiUrl ? [...urls, gfiUrl] : urls;
  }, [] as string[]);
  return Promise.all(
    gfiUrls.map((url) =>
      fetch(url)
        .then((response) => response.json())
        .then((collection: FeatureCollection) => collection.features),
    ),
  ).then((features) => features.flat());
}

const getFeaturesFromWmsSourcesThrottled = throttle(
  getFeaturesFromWmsSources,
  250,
);

export async function readFeaturesAtPixel(
  map: Map,
  event: MapBrowserEvent<PointerEvent>,
) {
  return [
    ...getFeaturesFromVectorSources(map, event.pixel),
    ...(await getFeaturesFromWmsSourcesThrottled(map, event.coordinate)),
  ];
}
