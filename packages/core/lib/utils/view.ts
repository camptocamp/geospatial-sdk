import { transformExtent } from "ol/proj";
import { WfsEndpoint, WmsEndpoint, WmtsEndpoint } from "@camptocamp/ogc-client";
import { LONLAT_CRS_CODES } from "../constant/projections";
import { fromEPSGCode, register } from "ol/proj/proj4";
import proj4 from "proj4";
import {
  Extent,
  MapContextLayer,
  MapContextView,
  ViewByExtent,
  ViewByGeometry,
} from "../model";

export async function createViewFromLayer(
  layer: MapContextLayer,
): Promise<MapContextView | null> {
  if (layer.type === "wms") {
    return await getWmsLayerExtent(layer);
  } else if (layer.type === "wmts") {
    return await getWmtsLayerExtent(layer);
  } else if (layer.type === "geojson") {
    return computeExtentFromGeojson(layer.data);
  } else if (layer.type === "wfs") {
    return await getWfsLayerExtent(layer);
  } else {
    throw new Error(`Unsupported layer type: ${layer.type}`);
  }
}

function computeExtentFromGeojson(data: any): ViewByGeometry {
  return {
    geometry: data,
  };
}

async function getWmsLayerExtent(layer: any): Promise<ViewByExtent | null> {
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
      extent: transformExtent(
        boundingBoxes[lonLatCRS],
        "EPSG:4326",
        "EPSG:3857",
      ) as Extent,
    };
  } else {
    const availableEPSGCode = Object.keys(boundingBoxes)[0];
    register(proj4);
    const proj = await fromEPSGCode(availableEPSGCode);
    return {
      extent: transformExtent(
        boundingBoxes[availableEPSGCode],
        proj,
        "EPSG:3857",
      ) as Extent,
    };
  }
}

async function getWmtsLayerExtent(layer: any): Promise<ViewByExtent | null> {
  const endpoint = await new WmtsEndpoint(layer.url).isReady();
  const layerName = endpoint.getSingleLayerName() ?? layer.name;
  const wmtsLayer = endpoint.getLayerByName(layerName);
  return wmtsLayer.latLonBoundingBox
    ? {
        extent: transformExtent(
          wmtsLayer.latLonBoundingBox,
          "EPSG:4326",
          "EPSG:3857",
        ) as Extent,
      }
    : null;
}

async function getWfsLayerExtent(layer: any): Promise<ViewByExtent | null> {
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
