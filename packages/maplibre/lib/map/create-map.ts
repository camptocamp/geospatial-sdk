import {
  MapContext,
  MapContextLayer,
  removeSearchParams,
  ViewByZoomAndCenter,
} from "@geospatial-sdk/core";

import { Map, StyleSpecification } from "maplibre-gl";
import { FeatureCollection, Geometry } from "geojson";
import {
  OgcApiEndpoint,
  WfsEndpoint,
  WmsEndpoint,
} from "@camptocamp/ogc-client";
import { createDatasetFromGeoJsonLayer } from "../helpers/map.helpers";
import { Dataset, PartialStyleSpecification } from "../maplibre.models";

const featureCollection: FeatureCollection<Geometry | null> = {
  type: "FeatureCollection",
  features: [],
};

export async function createLayer(
  layerModel: MapContextLayer,
): Promise<PartialStyleSpecification> {
  const { type } = layerModel;

  switch (type) {
    case "wms": {
      const sourceId = `${layerModel.name}`;
      const layerId = `${layerModel.name}`;

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

      const dataset: Dataset = {
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
      };
      return dataset;
    }
    case "wfs": {
      const entryPoint = await new WfsEndpoint(layerModel.url).isReady();
      const url = entryPoint.getFeatureUrl(layerModel.featureType, {
        asJson: true,
        outputCrs: "EPSG:4326",
      });
      const geojson = await fetchGeoJson(url);
      return createDatasetFromGeoJsonLayer(layerModel, geojson!);
    }
    case "geojson": {
      let geojson;
      if (layerModel.url !== undefined) {
        geojson = layerModel.url;
      } else {
        const data = layerModel.data;
        if (typeof data === "string") {
          try {
            geojson = JSON.parse(data) as FeatureCollection;
          } catch (e) {
            console.warn("A layer could not be created", layerModel, e);
            geojson = featureCollection;
          }
        } else {
          geojson = data;
        }
      }
      return createDatasetFromGeoJsonLayer(layerModel, geojson);
    }
    case "ogcapi": {
      const ogcEndpoint = new OgcApiEndpoint(layerModel.url);
      let layerUrl: string;
      if (layerModel.useTiles) {
        console.warn("[Warning] OGC API - Tiles not yet implemented.");
        // if (layerModel.useTiles === "vector") {
        // } else if (layerModel.useTiles === "map") {
        // }
      } else {
        layerUrl = await ogcEndpoint.getCollectionItemsUrl(
          layerModel.collection,
          { ...layerModel.options, asJson: true },
        );
        const geojson = await fetchGeoJson(layerUrl).catch(
          () => featureCollection,
        );
        return createDatasetFromGeoJsonLayer(layerModel, geojson);
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
 * Resets a Maplibre map from a context; existing content will be cleared
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
    const partialMLStyle = await createLayer(layerModel);
    if (partialMLStyle.glyphs) {
      map.setGlyphs(partialMLStyle.glyphs);
    }
    if (partialMLStyle.sprite) {
      map.setSprite(partialMLStyle.sprite as string);
    }
    Object.keys(partialMLStyle.sources).forEach((sourceId) =>
      map.addSource(sourceId, partialMLStyle.sources[sourceId]),
    );
    partialMLStyle.layers.map((layer) => map.addLayer(layer));
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
