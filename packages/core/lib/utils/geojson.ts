import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import { Extent } from "../model/index.js";
import { extend } from "./coordinates.js";

export function ensureGeojson(
  value: FeatureCollection<Geometry | null> | string,
): FeatureCollection<Geometry | null> {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as FeatureCollection;
    } catch (e) {
      throw new Error(`Invalid GeoJSON string: ${e}`);
    }
  }
  return value;
}

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
