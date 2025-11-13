import Map from "ol/Map";
import {
  MapContext,
  MapContextLayer,
  MapContextView,
} from "@geospatial-sdk/core";
import { toLonLat, get as getProjection } from "ol/proj";
import Layer from "ol/layer/Layer";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorTileLayer from "ol/layer/VectorTile";
import XYZ from "ol/source/XYZ";
import TileWMS from "ol/source/TileWMS";
import VectorSource from "ol/source/Vector";
import VectorTile from "ol/source/VectorTile";
import WMTS from "ol/source/WMTS";
import OGCMapTile from "ol/source/OGCMapTile";
import OGCVectorTile from "ol/source/OGCVectorTile";
import GeoJSON from "ol/format/GeoJSON";

const GEOJSON = new GeoJSON();

/**
 * Extracts layer model information from an OpenLayers layer
 * @param layer
 */
function extractLayerModel(layer: Layer): MapContextLayer | null {
  const source = layer.getSource();

  if (!source) {
    return null;
  }

  // Common properties
  const attributionsFn = source.getAttributions();
  let attributionsString: string | undefined = undefined;

  if (attributionsFn) {
    // @ts-expect-error- OpenLayers AttributionLike can be called without arguments
    const attributionsResult = attributionsFn();
    if (attributionsResult) {
      attributionsString = Array.isArray(attributionsResult)
        ? attributionsResult.join(", ")
        : attributionsResult;
    }
  }

  const baseProperties = {
    visibility: layer.getVisible(),
    opacity: layer.getOpacity(),
    label: layer.get("label"),
    ...(attributionsString && { attributions: attributionsString }),
  };

  // Vector tile layers (MVT)
  if (layer instanceof VectorTileLayer && source instanceof VectorTile) {
    const url = source.getUrls()?.[0];
    if (!url) {
      return null;
    }
    return {
      type: "xyz",
      url,
      tileFormat: "application/vnd.mapbox-vector-tile",
      ...baseProperties,
    };
  }

  // XYZ layers
  if (layer instanceof TileLayer && source instanceof XYZ) {
    const url = source.getUrls()?.[0];

    if (!url) {
      return null;
    }

    return {
      type: "xyz",
      url,
      ...baseProperties,
    };
  }

  // WMS layers
  if (layer instanceof TileLayer && source instanceof TileWMS) {
    const params = source.getParams();
    const url = source.getUrls()?.[0];

    if (!url || !params.LAYERS) {
      return null;
    }

    return {
      type: "wms",
      url,
      name: params.LAYERS,
      ...(params.STYLES && { style: params.STYLES }),
      ...baseProperties,
    };
  }

  // WMTS layers
  if (layer instanceof TileLayer && source instanceof WMTS) {
    const url = source.getUrls()?.[0];
    const layerName = source.getLayer();

    if (!url || !layerName) {
      return null;
    }

    return {
      type: "wmts",
      url,
      name: layerName,
      ...baseProperties,
    };
  }

  // OGC API - Map Tiles
  if (layer instanceof TileLayer && source instanceof OGCMapTile) {
    const url = source.getUrls()?.[0];
    if (!url) {
      return null;
    }
    return {
      type: "ogcapi",
      url,
      collection: "",
      useTiles: "map",
      ...baseProperties,
    };
  }

  // OGC API - Vector Tiles
  if (layer instanceof VectorTileLayer && source instanceof OGCVectorTile) {
    const url = source.getUrls()?.[0];
    if (!url) {
      return null;
    }
    return {
      type: "ogcapi",
      url,
      collection: "",
      useTiles: "vector",
      ...baseProperties,
    };
  }

  // Vector layers (GeoJSON, WFS)
  if (layer instanceof VectorLayer && source instanceof VectorSource) {
    const getStyle = layer.getStyle();
    let style: string | undefined = undefined;
    if (getStyle && typeof getStyle === "string") {
      style = getStyle;
    } else {
      style = undefined;
    }

    const url = source.getUrl();

    // WFS layers have a function URL, not a string
    if (url && typeof url === "function") {
      // Call the function with dummy parameters to get the actual URL
      const dummyExtent: [number, number, number, number] = [0, 0, 1, 1];
      const dummyResolution = 1;
      const dummyProjection = getProjection("EPSG:3857")!;
      const urlString = url(dummyExtent, dummyResolution, dummyProjection);

      // Extract the base URL (before the ?)
      const baseUrl = urlString.split("?")[0];

      return {
        type: "wfs",
        url: baseUrl,
        featureType: "",
        style,
        ...baseProperties,
      };
    }

    if (url && typeof url === "string") {
      // Check if it's a WFS layer by looking at the URL
      if (url.includes("wfs") || url.includes("WFS")) {
        return {
          type: "wfs",
          url: url.split("?")[0],
          featureType: "",
          style,
          ...baseProperties,
        };
      }
      // Otherwise, treat as GeoJSON
      return {
        type: "geojson",
        url,
        style,
        ...baseProperties,
      };
    }

    // GeoJSON with inline data
    const features = source.getFeatures();
    if (features.length > 0) {
      const featureCollection = GEOJSON.writeFeaturesObject(features, {
        featureProjection: "EPSG:3857",
        dataProjection: "EPSG:4326",
      });
      return {
        type: "geojson",
        data: featureCollection,
        ...baseProperties,
      };
    } else {
      return null;
    }
  }

  return null;
}

/**
 * Extracts view information from an OpenLayers map
 * @param map
 */
function extractViewModel(map: Map): MapContextView | null {
  const view = map.getView();
  if (!view) {
    return null;
  }

  const center = view.getCenter();
  const zoom = view.getZoom();

  if (!center || zoom === undefined) {
    return null;
  }

  const centerLonLat = toLonLat(center, view.getProjection());

  return {
    center: centerLonLat as [number, number],
    zoom,
  };
}

/**
 * Create a MapContext from an OpenLayers map
 * @param map
 */
export function readContextFromMap(map: Map): MapContext {
  const layers: MapContextLayer[] = [];

  map.getLayers().forEach((layer) => {
    const layerModel = extractLayerModel(layer as Layer);
    if (layerModel) {
      layers.push(layerModel);
    }
  });

  const view = extractViewModel(map);

  return {
    layers,
    view,
  };
}
