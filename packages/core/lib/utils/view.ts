import { transformExtent } from "ol/proj";
import { WfsEndpoint, WmsEndpoint, WmtsEndpoint } from "@camptocamp/ogc-client";
import { LONLAT_CRS_CODES } from "../constant/projections";
import { fromEPSGCode, register } from "ol/proj/proj4";
import GeoJSON from "ol/format/GeoJSON";
import { extend } from "ol/extent";
import Feature from "ol/Feature";
import proj4 from "proj4";
import {
  Extent,
  MapContextLayer,
  MapContextLayerWfs,
  MapContextLayerWms,
  MapContextLayerWmts,
  MapContextView,
  ViewByExtent,
} from "../model";
import { FeatureCollection, Geometry } from "geojson";

const GEOJSON = new GeoJSON();

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
