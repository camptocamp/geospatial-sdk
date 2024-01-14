import {
  MapContext,
  MapContextLayer,
  MapContextView,
} from "@camptocamp/geospatial-sdk-core/lib/model";
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
import { removeSearchParams } from "@camptocamp/geospatial-sdk-core/lib/utils";
import { defaultStyle } from "./styles";

const geosjonFormat = new GeoJSON();

export function createLayer(layerModel: MapContextLayer): Layer {
  const { type } = layerModel;
  const style = defaultStyle;
  switch (type) {
    case "xyz":
      return new TileLayer({
        source: new XYZ({
          url: layerModel.url,
        }),
      });
    case "wms":
      return new TileLayer({
        source: new TileWMS({
          url: removeSearchParams(layerModel.url, ["request", "service"]),
          params: { LAYERS: layerModel.name },
          gutter: 20,
        }),
      });
    // TODO: implement when ogc-client can handle wmts
    // case 'wmts':
    //   return new TileLayer({
    //     source: new WMTS(layerModel.options),
    //   })
    case "wfs":
      return new VectorLayer({
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
            urlObj.searchParams.set("typename", layerModel.name);
            urlObj.searchParams.set("srsname", "EPSG:3857");
            urlObj.searchParams.set("bbox", `${extent.join(",")},EPSG:3857`);
            return urlObj.toString();
          },
          strategy: bboxStrategy,
        }),
        style,
      });
    case "geojson": {
      if ("url" in layerModel) {
        return new VectorLayer({
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
        return new VectorLayer({
          source: new VectorSource({
            features,
          }),
          style,
        });
      }
    }
    default:
      throw new Error(`Unrecognized layer type: ${layerModel.type}`);
  }
}

export function createView(viewModel: MapContextView, map: Map): View {
  const { center: centerInViewProj, zoom, maxZoom, maxExtent } = viewModel;
  const center = centerInViewProj
    ? fromLonLat(centerInViewProj, "EPSG:3857")
    : [0, 0];
  const view = new View({
    center,
    zoom,
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
 * Create an OpenLayers map from a context
 * @param context
 */
export function createMapFromContext(context: MapContext): Map {
  const map = new Map({});
  return resetMapFromContext(map, context);
}

/**
 * Resets an OpenLayers map from a context; existing content will be cleared
 * @param map
 * @param context
 */
export function resetMapFromContext(map: Map, context: MapContext): Map {
  map.setView(createView(context.view, map));
  map.getLayers().clear();
  context.layers.forEach((layer) => map.addLayer(createLayer(layer)));
  return map;
}
