import {
  MapContext,
  MapContextLayer,
  ViewByZoomAndCenter,
} from "@geospatial-sdk/core";
import { Map, StyleSpecification } from "maplibre-gl";
import { getGeometryTypes } from "../maplibre.helpers";
import { Feature, FeatureCollection } from "geojson";

export async function createLayer(
  layerModel: MapContextLayer,
): Promise<StyleSpecification> {
  const { type } = layerModel;
  console.log(`Creating layer of type ${type}`, layerModel);
  switch (type) {
    case "wms": {
      const url = new URL(layerModel.url);
      const version = url.searchParams.get("version") || "1.3.0";
      const crsParam = version === "1.3.0" ? "CRS" : "SRS";

      url.searchParams.set("service", "WMS");
      url.searchParams.set("request", "GetMap");
      url.searchParams.set(crsParam, "EPSG:3857");
      url.searchParams.set("width", "256");
      url.searchParams.set("height", "256");
      url.searchParams.set("format", "image/png");
      url.searchParams.set("transparent", "true");
      url.searchParams.set("layers", layerModel.name);
      url.searchParams.set("styles", "");

      const sourceId = `source-${layerModel.name}`;
      const layerId = `layer-${layerModel.name}`;

      const styleDiff = {
        sources: {
          [sourceId]: {
            type: "raster",
            tiles: [`${url.toString()}&bbox={bbox-epsg-3857}`],
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
    case "geojson": {
      const sourceId = `source-${layerModel.id}`;
      const layerId = `layer-${layerModel.id}`;

      let geojson;
      if (layerModel.url !== undefined) {
        const response = await fetch(layerModel.url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `[Error] Maplibre.util:: ${response.status} ${response.statusText}`,
          );
        }
        geojson = await response.json().catch((e) => console.log(e));
      } else {
        geojson = layerModel.data;
        if (typeof geojson === "string") {
          try {
            geojson = JSON.parse(geojson) as FeatureCollection;
          } catch (e) {
            console.warn("A layer could not be created", layerModel, e);
            geojson = {
              type: "FeatureCollection",
              features: [],
            } as FeatureCollection;
          }
        }

        const geometryTypes = getGeometryTypes(geojson.features as Feature[]);
        const layers = [];
        if (
          geometryTypes.includes("polygon") ||
          geometryTypes.includes("multipolygon")
        ) {
          layers.push({
            id: `${layerId}-fill`,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": "orange",
              "fill-opacity": 0.5,
            },
          });
        }
        if (
          geometryTypes.includes("point") ||
          geometryTypes.includes("multipoint")
        ) {
          layers.push({
            id: `${layerId}-circle`,
            type: "circle",
            source: sourceId,
            paint: {
              "circle-radius": 6,
              "circle-color": "blue",
              "circle-stroke-width": 1,
              "circle-stroke-color": "#0f172b",
            },
          });
        }

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
    map.addSource(
      Object.keys(styleDiff.sources)[0],
      Object.values(styleDiff.sources)[0],
    );
    map.addLayer(styleDiff.layers[0]);
  }
  return map;
}
