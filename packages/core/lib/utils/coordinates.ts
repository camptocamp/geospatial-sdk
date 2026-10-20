import { DEFAULT_CRS } from "../constant/projections.js";
import { Coordinate, CrsIdentifier, Extent } from "../model/map-context.js";
import proj4 from "proj4";

function isCoordinate(value: Coordinate | Extent): value is Coordinate {
  return value.length < 4;
}

/**
 * Returns the CRS of a coordinate or extent; defaults to EPSG:4326 (longitude/latitude)
 */
export function getCrs(value: Coordinate | Extent): string {
  const last = value[value.length - 1];
  return typeof last === "string" ? last : DEFAULT_CRS;
}

/**
 * Apply a CRS identifier to a coordinate; THIS DOES NOT TRANSFORM COORDINATES
 * @param value
 * @param crs
 */
export function setCrs(value: Coordinate, crs: CrsIdentifier): Coordinate;
/**
 * Apply a CRS identifier to an extent; THIS DOES NOT TRANSFORM COORDINATES
 * @param value
 * @param crs
 */
export function setCrs(value: Extent, crs: CrsIdentifier): Extent;
export function setCrs(
  value: Coordinate | Extent,
  crs: CrsIdentifier,
): Coordinate | Extent {
  const currentCrs = getCrs(value);
  if (currentCrs === crs) {
    return value;
  }
  if (isCoordinate(value)) {
    return [...value.slice(0, 2), crs] as Coordinate;
  }
  return [...value.slice(0, 4), crs] as Extent;
}

export function equals(value1: Coordinate, value2: Coordinate): boolean;
export function equals(value1: Extent, value2: Extent): boolean;
export function equals(
  value1: Coordinate | Extent,
  value2: Coordinate | Extent,
): boolean {
  const crs1 = getCrs(value1);
  const crs2 = getCrs(value2);
  const isCoordinate = value1.length < 4;
  if (isCoordinate) {
    return crs1 === crs2 && value1[0] === value2[0] && value1[1] === value2[1];
  }
  return (
    crs1 === crs2 &&
    value1[0] === value2[0] &&
    value1[2] === value2[2] &&
    value1[1] === value2[1] &&
    value1[3] === value2[3]
  );
}

/**
 * first extent will be modified
 * @param extent1
 * @param extent2
 */
export function extend(extent1: Extent, extent2: Extent): Extent {
  const crs1 = getCrs(extent1);
  const crs2 = getCrs(extent2);
  if (crs1 !== crs2) {
    throw new Error(
      `Cannot combine extents with different CRS: ${crs1} and ${crs2}`,
    );
  }
  if (extent2[0] < extent1[0]) {
    extent1[0] = extent2[0];
  }
  if (extent2[2] > extent1[2]) {
    extent1[2] = extent2[2];
  }
  if (extent2[1] < extent1[1]) {
    extent1[1] = extent2[1];
  }
  if (extent2[3] > extent1[3]) {
    extent1[3] = extent2[3];
  }
  return extent1;
}

/**
 * Project an extent into another CRS
 * @param value
 * @param toCrs
 */
export function transform(value: Extent, toCrs: CrsIdentifier): Extent;
/**
 * Project a coordinate into another CRS
 * @param value
 * @param toCrs
 */
export function transform(value: Coordinate, toCrs: CrsIdentifier): Coordinate;
export function transform(
  value: Coordinate | Extent,
  toCrs: CrsIdentifier,
): Coordinate | Extent {
  const crs = getCrs(value);
  if (crs === toCrs) {
    return value;
  }
  // convert using proj4
  try {
    if (isCoordinate(value)) {
      const coordinate = value.slice(0, 2) as [number, number];
      return proj4(crs, toCrs, coordinate);
    } else {
      const [minX, minY, maxX, maxY] = value.slice(0, 4) as [
        number,
        number,
        number,
        number,
      ];
      const [lonMin, latMin] = proj4(crs, toCrs, [minX, minY]);
      const [lonMax, latMax] = proj4(crs, toCrs, [maxX, maxY]);
      return [lonMin, latMin, lonMax, latMax];
    }
  } catch (e) {
    throw new Error(
      `Cannot convert from ${crs} to ${toCrs}: ${(e as Error)?.message ?? e}`,
    );
  }
}

/**
 * Returns another extent which is in geographic coordinates (EPSG:4326)
 * @param value
 */
export function toGeographic(value: Extent): Extract<Extent, { length: 4 }>;
/**
 * Returns another coordinate which is in geographic coordinates (EPSG:4326)
 * @param value
 */
export function toGeographic(
  value: Coordinate,
): Extract<Coordinate, { length: 2 }>;
export function toGeographic(
  value: Coordinate | Extent,
): Extract<Coordinate, { length: 2 }> | Extract<Extent, { length: 4 }> {
  if (isCoordinate(value)) {
    const transformed = transform(value, "EPSG:4326") as Coordinate;
    return transformed.slice(0, 2) as [number, number];
  }
  const transformed = transform(value as Extent, "EPSG:4326") as Extent;
  return transformed.slice(0, 4) as [number, number, number, number];
}
