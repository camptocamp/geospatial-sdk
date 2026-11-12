import { LONLAT_CRS_CODES } from "../constant/projections.js";
import {
  CrsIdentifier,
  Extent,
  MapContextLayer,
  MapContextLayerGeotiff,
  MapContextLayerWfs,
  MapContextLayerWms,
  MapContextLayerWmts,
  MapContextView,
  ViewByExtent,
} from "../model/index.js";
import { ensureGeojson, getExtentFromGeojson } from "./geojson.js";
import { extend, setCrs, transform } from "./coordinates.js";
import { type GeoTIFFImage } from "geotiff";

/**
 * Creates a view from a layer by extracting its extent. The returned extent is preferably
 * returned in EPSG:4326; if not available, it will be returned in a CRS available for this layer
 *
 * @param layer - The map context layer to extract the extent from
 * @returns A Promise resolving to a `ViewByExtent` object, or `null` if the extent cannot be determined
 * @throws {Error} If the layer type is not supported
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
 */
export async function createViewFromLayer(
  layer: MapContextLayer,
): Promise<MapContextView | null> {
  if (layer.type === "wms") {
    return await getWmsLayerExtent(layer);
  } else if (layer.type === "wmts") {
    return await getWmtsLayerExtent(layer);
  } else if (layer.type === "geojson" && layer.data) {
    return {
      extent: getExtentFromGeojson(ensureGeojson(layer.data)),
    };
  } else if (layer.type === "wfs") {
    return await getWfsLayerExtent(layer);
  } else if (layer.type === "geotiff") {
    return await getGeotiffLayerExtent(layer);
  } else {
    throw new Error(`Unsupported layer type: ${layer.type}`);
  }
}

async function getWmsLayerExtent(
  layer: MapContextLayerWms,
): Promise<ViewByExtent | null> {
  const { WmsEndpoint } = await import("@camptocamp/ogc-client");
  const endpoint = await new WmsEndpoint(layer.url).isReady();
  const { boundingBoxes } = endpoint.getLayerByName(layer.name);
  if (!Object.keys(boundingBoxes).length) {
    return null;
  }
  const lonLatCRS = Object.keys(boundingBoxes).find((crs) =>
    LONLAT_CRS_CODES.includes(crs),
  );
  // give priority to lon/lat bounding boxes
  if (lonLatCRS) {
    return {
      extent: boundingBoxes[lonLatCRS],
    };
  }
  // otherwise take the first extent and apply its CRS
  const availableEPSGCode = Object.keys(boundingBoxes)[0];
  return {
    extent: [...boundingBoxes[availableEPSGCode], availableEPSGCode],
  };
}

async function getWmtsLayerExtent(
  layer: MapContextLayerWmts,
): Promise<ViewByExtent | null> {
  const { WmtsEndpoint } = await import("@camptocamp/ogc-client");
  const endpoint = await new WmtsEndpoint(layer.url).isReady();
  const layerName = endpoint.getSingleLayerName() ?? layer.name;
  const wmtsLayer = endpoint.getLayerByName(layerName);
  return wmtsLayer.latLonBoundingBox
    ? {
        extent: wmtsLayer.latLonBoundingBox as Extent,
      }
    : null;
}

async function getWfsLayerExtent(
  layer: MapContextLayerWfs,
): Promise<ViewByExtent | null> {
  const { WfsEndpoint } = await import("@camptocamp/ogc-client");
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

async function getGeotiffLayerExtent(
  layer: MapContextLayerGeotiff,
): Promise<ViewByExtent | null> {
  const { fromUrl } = await import("geotiff");
  async function getProjectionFromKeys(
    geoKeys: Record<string, any>,
    geoKey: string,
  ) {
    const value = geoKeys[geoKey];
    if (value && value !== 32767) {
      return "EPSG:" + value;
    }
    return null;
  }
  async function getProjection(
    image: GeoTIFFImage,
  ): Promise<CrsIdentifier | null> {
    const geoKeys = image.getGeoKeys();
    if (!geoKeys) {
      return null;
    }
    const projection = await getProjectionFromKeys(
      geoKeys,
      "ProjectedCSTypeGeoKey",
    );
    if (projection) {
      return projection;
    }
    return await getProjectionFromKeys(geoKeys, "GeographicTypeGeoKey");
  }

  const geotiff = await fromUrl(layer.url);
  const imageCount = await geotiff.getImageCount();
  const totalExtent = [Infinity, Infinity, -Infinity, -Infinity] as Extent;
  for (let i = 0; i < imageCount; i++) {
    const image = await geotiff.getImage(i);
    const projection = await getProjection(image);
    if (!projection) {
      continue;
    }
    let rawExtent: Extent;
    try {
      rawExtent = setCrs(image.getBoundingBox(true) as Extent, projection);
    } catch {
      rawExtent = setCrs(
        [0, 0, image.getWidth(), image.getHeight()],
        projection,
      );
    }
    const extent = transform(rawExtent, "EPSG:4326");
    extend(totalExtent, extent);
  }
  const isFinite = totalExtent.every((value) => Number.isFinite(value));
  if (!isFinite) {
    return null;
  }
  return { extent: totalExtent };
}
