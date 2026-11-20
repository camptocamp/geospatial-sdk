import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import { Extent, MapContextLayerGeojson } from "../model/index.js";
import { extend } from "./coordinates.js";
import { sharedFetch, useCache } from "@camptocamp/ogc-client";

/**
 * This assumes the geometry is in EPSG:4326
 * TODO: support other CRSs
 * @param geometry
 */
export function getExtentFromGeometry(geometry: Geometry): Extent {
  // use the bounding box if specified in the GeoJSON object
  if (geometry.bbox) {
    return geometry.bbox.length > 5
      ? [
          geometry.bbox[0],
          geometry.bbox[1],
          geometry.bbox[3],
          geometry.bbox[4] as number,
        ]
      : (geometry.bbox as Extent);
  }

  const coordinatesReducer = (prev: Extent, coords: Position) => {
    if (coords[0] < prev[0]) {
      prev[0] = coords[0];
    }
    if (coords[1] < prev[1]) {
      prev[1] = coords[1];
    }
    if (coords[0] > prev[2]) {
      prev[2] = coords[0];
    }
    if (coords[1] > prev[3]) {
      prev[3] = coords[1];
    }
    return prev;
  };
  const coordinatesArrayReducer = (prev: Extent, coordsArray: Position[]) => {
    const bbox = coordsArray.reduce(coordinatesReducer, [
      Infinity,
      Infinity,
      -Infinity,
      -Infinity,
    ]);
    return extend(prev, bbox);
  };

  const initialExtent = [Infinity, Infinity, -Infinity, -Infinity] as Extent;

  switch (geometry.type) {
    case "MultiPolygon":
      return geometry.coordinates.reduce((prev, polygonCoords) => {
        const bbox = polygonCoords.reduce(coordinatesArrayReducer, [
          Infinity,
          Infinity,
          -Infinity,
          -Infinity,
        ]);
        return extend(prev, bbox);
      }, initialExtent);
    case "GeometryCollection":
      return geometry.geometries.reduce((prev, geom) => {
        const bbox = getExtentFromGeometry(geom);
        return extend(prev, bbox);
      }, initialExtent);
    case "Polygon":
    case "MultiLineString":
      return geometry.coordinates.reduce(coordinatesArrayReducer, [
        Infinity,
        Infinity,
        -Infinity,
        -Infinity,
      ]);
    case "LineString":
    case "MultiPoint":
      return geometry.coordinates.reduce<Extent>(coordinatesReducer, [
        Infinity,
        Infinity,
        -Infinity,
        -Infinity,
      ]);
    case "Point":
      return coordinatesReducer(
        [Infinity, Infinity, -Infinity, -Infinity],
        geometry.coordinates,
      );
  }
}

/**
 * This assumes the geometry is in EPSG:4326
 * TODO: support other CRSs
 * @param geojson
 */
export function getExtentFromGeojson(
  geojson:
    FeatureCollection<Geometry | null> | Feature<Geometry | null> | Geometry,
): Extent {
  const empty = [Infinity, Infinity, -Infinity, -Infinity] as Extent;
  if ("type" in geojson) {
    switch (geojson.type) {
      case "FeatureCollection":
        return geojson.features.reduce((prev, feature) => {
          if (feature.geometry) {
            const bbox = getExtentFromGeometry(feature.geometry);
            return extend(prev, bbox);
          }
          return prev;
        }, empty);
      case "Feature":
        if (geojson.geometry) {
          return getExtentFromGeometry(geojson.geometry);
        }
        return empty;
      default:
        return getExtentFromGeometry(geojson);
    }
  }
  return empty;
}

function ensureFeatureCollection(
  value: unknown,
): FeatureCollection<Geometry | null> {
  const isGeojson =
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string";
  const isFeatureCollection =
    isGeojson &&
    value.type === "FeatureCollection" &&
    Array.isArray((value as FeatureCollection).features);
  const isFeature =
    isGeojson &&
    value.type === "Feature" &&
    "properties" in value &&
    typeof value.properties === "object";
  if (!isFeatureCollection && !isFeature) {
    throw new Error("GeoJSON layer data is not a valid GeoJSON object");
  }
  if (isFeature) {
    return {
      type: "FeatureCollection",
      features: [value],
    } as FeatureCollection<Geometry | null>;
  }
  return value as FeatureCollection<Geometry | null>;
}

/**
 * This will read the layer data and keep it in cache for future calls; it will
 * also properly report errors in case of invalid GeoJSON or network issues
 */
export async function readLayerData(
  layer: MapContextLayerGeojson,
): Promise<FeatureCollection<Geometry | null>> {
  if ("data" in layer) {
    if (typeof layer.data === "string") {
      let parsed: unknown;
      try {
        parsed = JSON.parse(layer.data);
      } catch (e) {
        throw new Error(`GeoJSON layer data parsing failed: ${e}`);
      }
      return ensureFeatureCollection(parsed);
    }
    return layer.data!;
  }
  return useCache(
    () =>
      sharedFetch(layer.url).then((response) =>
        response
          .json()
          .catch((e: Error) => {
            throw new Error(`GeoJSON layer data parsing failed: ${e}`);
          })
          .then(ensureFeatureCollection),
      ),
    `getGeojsonFromUrl`,
    layer.url,
  );
}
