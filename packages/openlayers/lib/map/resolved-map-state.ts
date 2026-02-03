import Map from "ol/Map.js";
import { transform as transformCoordinate, transformExtent } from "ol/proj.js";
import { Coordinate, Extent, ResolvedMapViewState } from "@geospatial-sdk/core";

/**
 * This magic value is generally used across OGC services as a reasonable approximation for most displays
 */
const PIXEL_SIZE_MM = 0.28;

/**
 * Reads the current view state of the map.
 * @param map
 */
export function readMapViewState(map: Map): ResolvedMapViewState {
  const view = map.getView();
  const projection = view.getProjection();
  const extent = transformExtent(
    view.calculateExtent(map.getSize()),
    projection,
    "EPSG:4326",
  ) as Extent;
  const center = transformCoordinate(
    view.getCenter() ?? [0, 0],
    projection,
    "EPSG:4326",
  ) as Coordinate;
  const resolution = view.getResolution() ?? 1;
  const metersPerUnit = projection.getMetersPerUnit() ?? 1;
  const scaleDenominator = metersPerUnit * resolution * (1000 / PIXEL_SIZE_MM);
  const bearing = view.getRotation() * (180 / Math.PI) + 90; // by default, bearing is North
  return {
    center,
    extent,
    resolution,
    scaleDenominator,
    bearing,
  };
}
