import {
  MapContext,
  MapContextLayer,
  removeSearchParams,
  ViewByZoomAndCenter,
} from "@geospatial-sdk/core";

import { Map, StyleSpecification } from "maplibre-gl";
import { createStyleFromGeoJson } from "../maplibre.helpers";
import { FeatureCollection } from "geojson";
import {
  OgcApiEndpoint,
  WfsEndpoint,
  WmsEndpoint,
} from "@camptocamp/ogc-client";

const featureCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export async function createLayer(
  layerModel: MapContextLayer,
): Promise<StyleSpecification> {
  const { type } = layerModel;

  switch (type) {
    case "wms": {
      const sourceId = `source-${layerModel.name}`;
      const layerId = `layer-${layerModel.name}`;

      const endpoint = await new WmsEndpoint(layerModel.url).isReady();
      let url = endpoint.getMapUrl([layerModel.name], {
        widthPx: 256,
        heightPx: 256,
        extent: [0, 0, 0, 0], // will be replaced by maplibre-gl
        outputFormat: "image/png",
        crs: "EPSG:3857",
      });
      url = removeSearchParams(url, ["bbox"]);
      url = `${url.toString()}&bbox={bbox-epsg-3857}`;

      const styleDiff = {
        sources: {
          [sourceId]: {
            type: "raster",
            tiles: [url],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: layerId,
            type: "raster",
            source: sourceId,
            paint: {},
          },
        ],
      } as StyleSpecification;
      return styleDiff;
    }
    case "wfs": {
      const entryPoint = new WfsEndpoint(layerModel.url);
      await entryPoint.isReady();
      const url = entryPoint.getFeatureUrl(layerModel.featureType, {
        asJson: true,
        outputCrs: "EPSG:4326",
      });
      const geojson = await fetchGeoJson(url);
      return createStyleFromGeoJson(layerModel.featureType, geojson!);
    }
    case "geojson": {
      let geojson;
      if (layerModel.url !== undefined) {
        geojson = await fetchGeoJson(layerModel.url).catch(
          () => featureCollection,
        );
      } else {
        const data = layerModel.data;
        if (typeof data === "string") {
          try {
            geojson = JSON.parse(data) as FeatureCollection;
          } catch (e) {
            console.warn("A layer could not be created", layerModel, e);
            geojson = featureCollection;
          }
        }
      }
      return createStyleFromGeoJson(layerModel.id?.toString() || "", geojson!);
    }
    case "ogcapi": {
      const ogcEndpoint = new OgcApiEndpoint(layerModel.url);
      let layerUrl: string;
      if (layerModel.useTiles) {
        if (layerModel.useTiles === "vector") {
        } else if (layerModel.useTiles === "map") {
        }
      } else {
        layerUrl = await ogcEndpoint.getCollectionItemsUrl(
          layerModel.collection,
          { ...layerModel.options, asJson: true },
        );
        console.log("Loading OGC API - Features from", layerUrl);
        const geojson = await fetchGeoJson(layerUrl).catch(
          () => featureCollection,
        );
        return createStyleFromGeoJson(layerModel.collection, geojson!);
      }
      break;
    }
    case "maplibre-style": {
      const style = await fetch(layerModel.styleUrl).then((res) => res.json());
      return style;
    }
  }
  return {} as StyleSpecification;
}

/**
 * Create an OpenLayers map from a context; optionally specify a target (root element) for the map
 * @param context
 * @param target
 */
export async function createMapFromContext(
  context: MapContext,
  container: string | HTMLElement,
): Promise<Map> {
  const map = new Map({
    container,
  });
  return await resetMapFromContext(map, context);
}

/**
 * Resets an OpenLayers map from a context; existing content will be cleared
 * @param map
 * @param context
 */
export async function resetMapFromContext(
  map: Map,
  context: MapContext,
): Promise<Map> {
  map.setZoom((context.view as ViewByZoomAndCenter).zoom);
  map.setCenter((context.view as ViewByZoomAndCenter).center);

  for (const layerModel of context.layers) {
    const styleDiff = await createLayer(layerModel);
    if (styleDiff.glyphs) {
      map.setGlyphs(styleDiff.glyphs);
    }
    if (styleDiff.sprite) {
      map.setSprite(styleDiff.sprite as string);
    }
    Object.keys(styleDiff.sources).forEach((sourceId) =>
      map.addSource(sourceId, styleDiff.sources[sourceId]),
    );
    styleDiff.layers.map((layer) => map.addLayer(layer));
  }
  return map;
}

async function fetchGeoJson(url: string): Promise<FeatureCollection> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `[Error] Maplibre.util:: ${response.status} ${response.statusText}`,
    );
  }
  return await response.json();
}
