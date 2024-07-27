import GeoJSON from "ol/format/GeoJSON";
import { isEmpty, extend, Extent } from "ol/extent";
import { transformExtent } from "ol/proj";
import { WmsEndpoint, WmtsEndpoint } from "@camptocamp/ogc-client";
import { LONLAT_CRS_CODES } from "../constant/projections";
import { fromEPSGCode, register } from "ol/proj/proj4";
import proj4 from "proj4/dist/proj4";

const GEOJSON = new GeoJSON();

export async function createViewFromExtent(extent: Extent): Promise<void> {
  fitViewToExtent(extent);
}

export async function createViewFromLayer(layer: any): Promise<void> {
  let extent: Extent | null = null;

  switch (layer.type) {
    case "WMS":
      extent = await getWmsLayerExtent(layer);
      break;
    case "WMTS":
      extent = await getWmtsLayerExtent(layer);
      break;
    case "Geojson":
      extent = computeExtentFromGeojson(layer.data);
      break;
    default:
      throw new Error(`Unsupported layer type: ${layer.type}`);
  }

  if (extent && !isEmpty(extent)) {
    fitViewToExtent(extent);
  } else {
    throw new Error("Could not compute extent for the layer");
  }
}

function fitViewToExtent(extent: Extent): void {
  // Implementation to fit view to extent
}

function computeExtentFromGeojson(data: any): Extent {
  const features = GEOJSON.readFeatures(data);
  return features.reduce(
    (prev, curr) => {
      const geom = curr.getGeometry();
      return geom ? extend(prev, geom.getExtent()) : prev;
    },
    [Infinity, Infinity, -Infinity, -Infinity],
  );
}

async function getWmsLayerExtent(layer: any): Promise<Extent | null> {
  const endpoint = await new WmsEndpoint(layer.url).isReady();
  const { boundingBoxes } = endpoint.getLayerByName(layer.name);
  if (!Object.keys(boundingBoxes).length) {
    return null;
  }
  const lonLatCRS = Object.keys(boundingBoxes).find((crs) =>
    LONLAT_CRS_CODES.includes(crs),
  );
  if (lonLatCRS) {
    return transformExtent(boundingBoxes[lonLatCRS], "EPSG:4326", "EPSG:3857");
  } else {
    const availableEPSGCode = Object.keys(boundingBoxes)[0];
    register(proj4);
    const proj = await fromEPSGCode(availableEPSGCode);
    return transformExtent(boundingBoxes[availableEPSGCode], proj, "EPSG:3857"); // Transform to 'EPSG:3857'
  }
}

async function getWmtsLayerExtent(layer: any): Promise<Extent | null> {
  const endpoint = await new WmtsEndpoint(layer.url).isReady();
  const layerName = endpoint.getSingleLayerName() ?? layer.name;
  const wmtsLayer = endpoint.getLayerByName(layerName);
  return wmtsLayer.latLonBoundingBox
    ? transformExtent(wmtsLayer.latLonBoundingBox, "EPSG:4326", "EPSG:3857")
    : null;
}
