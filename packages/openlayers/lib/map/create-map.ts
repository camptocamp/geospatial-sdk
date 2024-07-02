import {
  MapContext,
  MapContextLayer,
  MapContextView,
} from "@geospatial-sdk/core";
import Map from "ol/Map";
import View from "ol/View";
import Layer from "ol/layer/Layer";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import TileWMS from "ol/source/TileWMS";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import Geometry from "ol/geom/Geometry";
import { fromLonLat } from "ol/proj";
import { bbox as bboxStrategy } from "ol/loadingstrategy";
import { removeSearchParams } from "@geospatial-sdk/core";
import { defaultStyle } from "./styles";
import VectorTileLayer from "ol/layer/VectorTile";
import {OGCMapTile, OGCVectorTile} from "ol/source";
import {MVT} from "ol/format";
import {OgcApiEndpoint} from "@camptocamp/ogc-client";

const geosjonFormat = new GeoJSON();

export async function createLayer(layerModel: MapContextLayer): Promise<Layer> {
  const { type } = layerModel;
  const style = defaultStyle;
  let layer: Layer | undefined;
  switch (type) {
    case "xyz":
      layer = new TileLayer({
        source: new XYZ({
          url: layerModel.url,
        }),
      });
      break;
    case "wms":
      layer = new TileLayer({
        source: new TileWMS({
          url: removeSearchParams(layerModel.url, ["request", "service"]),
          params: { LAYERS: layerModel.name },
          gutter: 20,
        }),
      });
      break;
    // TODO: implement when ogc-client can handle wmts
    // case 'wmts':
    //   return new TileLayer({
    //     source: new WMTS(layerModel.options),
    //   })
    case "wfs":
      layer = new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON(),
          url: function (extent) {
            const urlObj = new URL(
              removeSearchParams(layerModel.url, [
                "service",
                "version",
                "request",
              ]),
            );
            urlObj.searchParams.set("service", "WFS");
            urlObj.searchParams.set("version", "1.1.0");
            urlObj.searchParams.set("request", "GetFeature");
            urlObj.searchParams.set("outputFormat", "application/json");
            urlObj.searchParams.set("typename", layerModel.featureType);
            urlObj.searchParams.set("srsname", "EPSG:3857");
            urlObj.searchParams.set("bbox", `${extent.join(",")},EPSG:3857`);
            return urlObj.toString();
          },
          strategy: bboxStrategy,
        }),
        style,
      });
      break;
    case "geojson": {
      if (layerModel.url !== undefined) {
        layer = new VectorLayer({
          source: new VectorSource({
            format: new GeoJSON(),
            url: layerModel.url,
          }),
          style,
        });
      } else {
        let geojson = layerModel.data;
        if (typeof geojson === "string") {
          try {
            geojson = JSON.parse(geojson);
          } catch (e) {
            console.warn("A layer could not be created", layerModel, e);
            geojson = { type: "FeatureCollection", features: [] };
          }
        }
        const features = geosjonFormat.readFeatures(geojson, {
          featureProjection: "EPSG:3857",
          dataProjection: "EPSG:4326",
        }) as Feature<Geometry>[];
        layer = new VectorLayer({
          source: new VectorSource({
            features,
          }),
          style,
        });
      }
      break;
    }
    case "ogcapi": {
      const ogcEndpoint = await new OgcApiEndpoint(layerModel.url);
      let layerUrl: string;
      if (layerModel.useTiles) {
        if (layerModel.useTiles === 'vector') {
          layerUrl = await ogcEndpoint.getVectorTilesetUrl(layerModel.collection, layerModel.tileMatrixSet);
          layer = new VectorTileLayer({
            source: new OGCVectorTile({
              url: layerUrl,
              format: new MVT(),
            }),
          });
        } else if (layerModel.useTiles === 'map') {
          layerUrl = await ogcEndpoint.getMapTilesetUrl(layerModel.collection, layerModel.tileMatrixSet);
          layer = new TileLayer({
            source: new OGCMapTile({
              url: layerUrl,
            }),
          });
        }
      } else {
        layerUrl = await ogcEndpoint.getCollectionItemsUrl(layerModel.collection, layerModel.options);
        layer = new VectorLayer({
          source: new VectorSource({
            format: new GeoJSON(),
            url: layerUrl,
          }),
          style,
        });
      }
      break;
    }
    default:
      throw new Error(`Unrecognized layer type: ${layerModel.type}`);
  }
  if (!layer) {
    throw new Error(`Layer could not be created for type: ${layerModel.type}`);
  }
  typeof layerModel.visibility !== "undefined" &&
    layer.setVisible(layerModel.visibility);
  typeof layerModel.opacity !== "undefined" &&
    layer.setOpacity(layerModel.opacity);
  typeof layerModel.attributions !== "undefined" &&
    layer.getSource()?.setAttributions(layerModel.attributions);
  layer.set("label", layerModel.label);

  return layer;
}

export function createView(viewModel: MapContextView, map: Map): View {
  const { center: centerInViewProj, zoom, maxZoom, maxExtent } = viewModel;
  const center = centerInViewProj
    ? fromLonLat(centerInViewProj, "EPSG:3857")
    : [0, 0];
  const view = new View({
    center,
    zoom: zoom ?? 0,
    maxZoom,
    extent: maxExtent,
    multiWorld: false,
    constrainResolution: true,
  });
  if (viewModel.extent) {
    view.fit(viewModel.extent, {
      size: map.getSize(),
    });
  }
  return view;
}

/**
 * Create an OpenLayers map from a context; optionally specify a target (root element) for the map
 * @param context
 * @param target
 */
export async function createMapFromContext(
    context: MapContext,
    target?: string | HTMLElement,
): Promise<Map> {
  const map = new Map({
    target,
  });
  return await resetMapFromContext(map, context);
}

/**
 * Resets an OpenLayers map from a context; existing content will be cleared
 * @param map
 * @param context
 */
export async function resetMapFromContext(map: Map, context: MapContext): Promise<Map> {
  map.setView(createView(context.view, map));
  map.getLayers().clear();
  for (const layerModel of context.layers) {
    const layer = await createLayer(layerModel);
    map.addLayer(layer);
  }
  return map;
}
