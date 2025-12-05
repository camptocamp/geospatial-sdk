import {
  MapContext,
  MapContextLayer,
  removeSearchParams,
  ViewByZoomAndCenter,
} from "@geospatial-sdk/core";

import {
  LayerSpecification,
  Map,
  MapOptions,
  StyleSpecification,
} from "maplibre-gl";
import { FeatureCollection, Geometry } from "geojson";
import {
  OgcApiEndpoint,
  WfsEndpoint,
  WmsEndpoint,
} from "@camptocamp/ogc-client";
import {
  createDatasetFromGeoJsonLayer,
  generateLayerId,
} from "../helpers/map.helpers";
import { Dataset, PartialStyleSpecification } from "../maplibre.models";

const featureCollection: FeatureCollection<Geometry | null> = {
  type: "FeatureCollection",
  features: [],
};

export async function createLayer(
  layerModel: MapContextLayer,
  sourcePosition: number,
): Promise<PartialStyleSpecification> {
  const { type } = layerModel;

  switch (type) {
    case "wms": {
      const layerId = generateLayerId(layerModel);
      const sourceId = layerId;

      const endpoint = await new WmsEndpoint(layerModel.url).isReady();
      let url = endpoint.getMapUrl([layerModel.name], {
        widthPx: 256,
        heightPx: 256,
        extent: [0, 0, 0, 0], // will be replaced by maplibre-gl
        outputFormat: "image/png",
        crs: "EPSG:3857",
      });
      url = removeSearchParams(url, ["bbox"]);
      url = `${url.toString()}&BBOX={bbox-epsg-3857}`;

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
            metadata: {
              sourcePosition,
            },
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
      return createDatasetFromGeoJsonLayer(layerModel, url, sourcePosition);
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
      return createDatasetFromGeoJsonLayer(layerModel, geojson, sourcePosition);
    }
    case "ogcapi": {
      const ogcEndpoint = new OgcApiEndpoint(layerModel.url);
      let layerUrl: string;
      if (layerModel.useTiles) {
        console.warn("[Warning] OGC API - Tiles not yet implemented.");
      } else {
        layerUrl = await ogcEndpoint.getCollectionItemsUrl(
          layerModel.collection,
          { ...layerModel.options, asJson: true },
        );
        return createDatasetFromGeoJsonLayer(
          layerModel,
          layerUrl,
          sourcePosition,
        );
      }
      break;
    }
    case "maplibre-style": {
      console.warn("[Warning] Maplibre style - Not yet fully implemented.");
      const style = await fetch(layerModel.styleUrl).then((res) => res.json());
      style.layers?.forEach(
        (layer: LayerSpecification) => (layer.metadata = { sourcePosition }),
      );
      return style;
    }
  }
  return {} as StyleSpecification;
}

/**
 * Create an Maplibre map from a context; optionally specify a target (root element) for the map
 * @param context
 * @param target
 */
export async function createMapFromContext(
  context: MapContext,
  mapOptions: MapOptions,
): Promise<Map> {
  const map = new Map(mapOptions);
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

  for (let i = 0; i < context.layers.length; i++) {
    const layerModel = context.layers[i];
    const partialMLStyle = await createLayer(layerModel, i);

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
