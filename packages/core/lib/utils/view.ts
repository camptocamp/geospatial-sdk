import { transformExtent } from "ol/proj.js";
import { WfsEndpoint, WmsEndpoint, WmtsEndpoint } from "@camptocamp/ogc-client";
import { LONLAT_CRS_CODES } from "../constant/projections.js";
import { fromEPSGCode, register } from "ol/proj/proj4.js";
import GeoJSON from "ol/format/GeoJSON.js";
import { extend } from "ol/extent.js";
import Feature from "ol/Feature.js";
import proj4 from "proj4";
import {
  Extent,
  MapContextLayer,
  MapContextLayerWfs,
  MapContextLayerWms,
  MapContextLayerWmts,
  MapContextView,
  ViewByExtent,
} from "../model/index.js";
import { FeatureCollection, Geometry } from "geojson";

const GEOJSON = new GeoJSON();

/**
 * Creates a view from a layer by extracting its geographic extent.
 *
 * This function automatically retrieves the bounding box (extent) of a layer based on its type,
 * fetching metadata from OGC services or computing it from geometries. The returned extent is
 * always expressed in EPSG:4326 (longitude/latitude) coordinates.
 *
 * @param layer - The map context layer to extract the extent from
 * @returns A Promise resolving to a ViewByExtent object, or null if the extent cannot be determined
 * @throws {Error} If the layer type is not supported
 *
 * @remarks
 * **Supported layer types:**
 * - **WMS**: Fetches bounding boxes from WMS GetCapabilities. Prefers lon/lat CRS (EPSG:4326, CRS:84),
 *   or transforms from the first available CRS using proj4.
 * - **WMTS**: Extracts the `latLonBoundingBox` from WMTS GetCapabilities metadata.
 * - **GeoJSON**: Computes the extent by iterating through all feature geometries.
 * - **WFS**: Retrieves the bounding box from the WFS DescribeFeatureType response.
 *
 * **Unsupported layer types:**
 * - XYZ (tile-based layers)
 * - OGC API
 * - MapLibre Style
 *
 * @example
 * ```typescript
 * const wmsLayer: MapContextLayerWms = {
 *   type: 'wms',
 *   url: 'https://example.com/wms',
 *   name: 'myLayer'
 * };
 *
 * const view = await createViewFromLayer(wmsLayer);
 * if (view) {
 *   console.log('Extent:', view.extent); // [minX, minY, maxX, maxY] in EPSG:4326
 * }
 * ```
 *
 * @see {@link ViewByExtent}
 * @see {@link MapContextLayer}
 */
export async function createViewFromLayer(
  layer: MapContextLayer,
): Promise<MapContextView | null> {
  if (layer.type === "wms") {
    return await getWmsLayerExtent(layer);
  } else if (layer.type === "wmts") {
    return await getWmtsLayerExtent(layer);
  } else if (layer.type === "geojson" && layer.data) {
    return computeExtentFromGeojson(layer.data);
  } else if (layer.type === "wfs") {
    return await getWfsLayerExtent(layer);
  } else {
    throw new Error(`Unsupported layer type: ${layer.type}`);
  }
}

/**
 * Computes the geographic extent of a GeoJSON dataset.
 *
 * This function parses GeoJSON data (either as a string or object) and calculates the
 * bounding box by iterating through all feature geometries and extending the extent
 * to include each geometry. Features without geometries are ignored.
 *
 * @param data - GeoJSON data as a FeatureCollection object or JSON string
 * @returns A ViewByExtent object with the computed extent in EPSG:4326
 *
 * @remarks
 * The function uses OpenLayers' GeoJSON reader and extent utilities to:
 * 1. Parse the GeoJSON data
 * 2. Read all features
 * 3. Extract each feature's geometry extent
 * 4. Combine all extents into a single bounding box
 *
 * The returned extent format is `[minX, minY, maxX, maxY]` (or `[west, south, east, north]`).
 *
 * @example
 * ```typescript
 * const geojson = {
 *   type: "FeatureCollection",
 *   features: [
 *     {
 *       type: "Feature",
 *       geometry: { type: "Point", coordinates: [2.3, 48.8] },
 *       properties: {}
 *     }
 *   ]
 * };
 *
 * const view = computeExtentFromGeojson(geojson);
 * console.log(view.extent); // [2.3, 48.8, 2.3, 48.8]
 * ```
 */
function computeExtentFromGeojson(
  data: FeatureCollection<Geometry | null> | string,
): ViewByExtent {
  const geojson = typeof data === "string" ? JSON.parse(data) : data;
  const features = GEOJSON.readFeatures(geojson) as Feature[];
  const extent = features.reduce(
    (prev, curr) => {
      const geom = curr.getGeometry();
      if (!geom) return prev;
      return extend(prev, geom.getExtent()) as Extent;
    },
    [Infinity, Infinity, -Infinity, -Infinity] as Extent,
  ) as Extent;
  return {
    extent,
  };
}

/**
 * Retrieves the geographic extent of a WMS layer from its GetCapabilities metadata.
 *
 * This function fetches the WMS GetCapabilities document and extracts bounding box information
 * for the specified layer. It handles coordinate system transformations to ensure the extent
 * is returned in EPSG:4326 (lon/lat).
 *
 * @param layer - The WMS layer configuration
 * @returns A Promise resolving to a ViewByExtent object, or null if no bounding box is available
 *
 * @remarks
 * **CRS Preference and Transformation:**
 * 1. **Preferred CRS**: First looks for bounding boxes in longitude/latitude CRS
 *    (EPSG:4326, CRS:84, or other lon/lat codes defined in `LONLAT_CRS_CODES`)
 * 2. **Fallback with transformation**: If no lon/lat CRS is found, uses the first available CRS
 *    and transforms it to EPSG:4326 using proj4
 * 3. **No bounding box**: Returns null if the layer has no bounding box metadata
 *
 * The function uses `@camptocamp/ogc-client` to parse the WMS capabilities and extract
 * the bounding boxes associated with the layer.
 *
 * @example
 * ```typescript
 * const wmsLayer: MapContextLayerWms = {
 *   type: 'wms',
 *   url: 'https://example.com/wms',
 *   name: 'ROADS'
 * };
 *
 * const view = await getWmsLayerExtent(wmsLayer);
 * if (view) {
 *   console.log('Layer extent:', view.extent); // [minLon, minLat, maxLon, maxLat]
 * }
 * ```
 *
 * @see {@link https://www.ogc.org/standards/wms | OGC WMS Standard}
 */
async function getWmsLayerExtent(
  layer: MapContextLayerWms,
): Promise<ViewByExtent | null> {
  const endpoint = await new WmsEndpoint(layer.url).isReady();
  const { boundingBoxes } = endpoint.getLayerByName(layer.name);
  if (!Object.keys(boundingBoxes).length) {
    return null;
  }
  const lonLatCRS = Object.keys(boundingBoxes).find((crs) =>
    LONLAT_CRS_CODES.includes(crs),
  );
  if (lonLatCRS) {
    return {
      extent: boundingBoxes[lonLatCRS] as Extent,
    };
  } else {
    const availableEPSGCode = Object.keys(boundingBoxes)[0];
    register(proj4);
    const proj = await fromEPSGCode(availableEPSGCode);
    return {
      extent: transformExtent(
        boundingBoxes[availableEPSGCode],
        proj,
        "EPSG:4326",
      ) as Extent,
    };
  }
}

/**
 * Retrieves the geographic extent of a WMTS layer from its GetCapabilities metadata.
 *
 * This function fetches the WMTS GetCapabilities document and extracts the
 * `WGS84BoundingBox` (also known as `latLonBoundingBox`) from the layer metadata.
 * The extent is already in EPSG:4326, so no coordinate transformation is needed.
 *
 * @param layer - The WMTS layer configuration
 * @returns A Promise resolving to a ViewByExtent object, or null if no lat/lon bounding box is available
 *
 * @remarks
 * **Layer Name Resolution:**
 * - If the capabilities document contains only one layer, that layer is used automatically
 * - Otherwise, the layer specified in `layer.name` is looked up
 *
 * **Bounding Box Format:**
 * - The `latLonBoundingBox` from WMTS capabilities is always in WGS84 (EPSG:4326)
 * - Returns null if the layer does not define a lat/lon bounding box
 *
 * The function uses `@camptocamp/ogc-client` to parse the WMTS capabilities.
 *
 * @example
 * ```typescript
 * const wmtsLayer: MapContextLayerWmts = {
 *   type: 'wmts',
 *   url: 'https://example.com/wmts/WMTSCapabilities.xml',
 *   name: 'satellite'
 * };
 *
 * const view = await getWmtsLayerExtent(wmtsLayer);
 * if (view) {
 *   console.log('Layer extent:', view.extent); // [minLon, minLat, maxLon, maxLat]
 * }
 * ```
 *
 * @see {@link https://www.ogc.org/standards/wmts | OGC WMTS Standard}
 */
async function getWmtsLayerExtent(
  layer: MapContextLayerWmts,
): Promise<ViewByExtent | null> {
  const endpoint = await new WmtsEndpoint(layer.url).isReady();
  const layerName = endpoint.getSingleLayerName() ?? layer.name;
  const wmtsLayer = endpoint.getLayerByName(layerName);
  return wmtsLayer.latLonBoundingBox
    ? {
        extent: wmtsLayer.latLonBoundingBox as Extent,
      }
    : null;
}

/**
 * Retrieves the geographic extent of a WFS feature type from its GetCapabilities metadata.
 *
 * This function fetches the WFS GetCapabilities document and extracts the bounding box
 * from the feature type summary. The bounding box is typically provided in EPSG:4326
 * according to the WFS specification.
 *
 * @param layer - The WFS layer configuration
 * @returns A Promise resolving to a ViewByExtent object, or null if no bounding box is available
 *
 * @remarks
 * **Feature Type Lookup:**
 * - The function uses `layer.featureType` to look up the feature type in the capabilities
 * - Returns null if the feature type is not found or has no bounding box defined
 *
 * **Bounding Box:**
 * - WFS capabilities typically provide bounding boxes in WGS84 (EPSG:4326)
 * - The bounding box represents the extent of all features of this type
 *
 * The function uses `@camptocamp/ogc-client` to parse the WFS capabilities.
 *
 * @example
 * ```typescript
 * const wfsLayer: MapContextLayerWfs = {
 *   type: 'wfs',
 *   url: 'https://example.com/wfs',
 *   featureType: 'buildings'
 * };
 *
 * const view = await getWfsLayerExtent(wfsLayer);
 * if (view) {
 *   console.log('Feature type extent:', view.extent); // [minLon, minLat, maxLon, maxLat]
 * }
 * ```
 *
 * @see {@link https://www.ogc.org/standards/wfs | OGC WFS Standard}
 */
async function getWfsLayerExtent(
  layer: MapContextLayerWfs,
): Promise<ViewByExtent | null> {
  const endpoint = await new WfsEndpoint(layer.url).isReady();
  const featureTypeSummary = endpoint.getFeatureTypeSummary(layer.featureType);
  const boundingBox = featureTypeSummary?.boundingBox;
  if (!boundingBox) {
    return null;
  }
  return {
    extent: boundingBox,
  };
}
