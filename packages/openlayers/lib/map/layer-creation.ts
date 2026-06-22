import {
  defaultStyle,
  MapContextLayer,
  removeSearchParams,
} from "@geospatial-sdk/core";
import Layer from "ol/layer/Layer.js";
import TileLayer from "ol/layer/Tile.js";
import XYZ from "ol/source/XYZ.js";
import TileWMS from "ol/source/TileWMS.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import GeoJSON from "ol/format/GeoJSON.js";
import Feature from "ol/Feature.js";
import Geometry from "ol/geom/Geometry.js";
import { bbox as bboxStrategy } from "ol/loadingstrategy.js";
import VectorTileLayer from "ol/layer/VectorTile.js";
import OGCMapTile from "ol/source/OGCMapTile.js";
import OGCVectorTile from "ol/source/OGCVectorTile.js";
import WMTS from "ol/source/WMTS.js";
import MVT from "ol/format/MVT.js";
import {
  EndpointError,
  OgcApiEndpoint,
  WfsEndpoint,
  WmtsEndpoint,
} from "@camptocamp/ogc-client";
import { MapboxVectorLayer } from "ol-mapbox-style";
import { Tile } from "ol";
import { tileLoadErrorCatchFunction } from "./handle-errors.js";
import VectorTile from "ol/source/VectorTile.js";
import GeoTIFF from "ol/source/GeoTIFF.js";
import WebGLTileLayer from "ol/layer/WebGLTile.js";
import { updateLayerProperties } from "./layer-update.js";
import {
  emitLayerCreationError,
  emitLayerLoadingError,
  emitLayerLoadingStatusSuccess,
} from "./register-events.js";
import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";
import { buildWmsParams } from "./wms-params.js";
import ImageLayer from "ol/layer/Image.js";
import ImageWMS from "ol/source/ImageWMS.js";

const GEOJSON = new GeoJSON();
const WFS_MAX_FEATURES = 10000;

// We need to defer some events being dispatched to make sure they are caught by the map
// where the layers sit
// FIXME: this should be better handled in a separate module!
const defer = () => new Promise((resolve) => setTimeout(resolve, 0));

export async function createLayer(layerModel: MapContextLayer): Promise<Layer> {
  const { type } = layerModel;
  let layer: Layer;

  switch (type) {
    case "xyz":
      {
        if (layerModel.tileFormat === "application/vnd.mapbox-vector-tile") {
          layer = new VectorTileLayer({
            source: new VectorTile({
              format: new MVT(),
              url: layerModel.url,
              attributions: layerModel.attributions,
            }),
          });
        } else {
          layer = new TileLayer({});
          const source = new XYZ({
            url: layerModel.url,
            referrerPolicy: layerModel.referrerPolicy,
            attributions: layerModel.attributions,
          });
          source.setTileLoadFunction(function (tile: Tile, src: string) {
            return tileLoadErrorCatchFunction(
              layer as TileLayer<XYZ>,
              tile,
              src,
            );
          });
          layer.setSource(source);
        }
        defer().then(() => emitLayerLoadingStatusSuccess(layer));
      }
      break;

    case "wms":
      {
        const url = removeSearchParams(layerModel.url, ["request", "service"]);
        const params = buildWmsParams(layerModel);
        if (layerModel.useTiles === false) {
          layer = new ImageLayer({
            source: new ImageWMS({
              url,
              params,
              referrerPolicy: layerModel.referrerPolicy,
              attributions: layerModel.attributions,
            }),
          });
        } else {
          layer = new TileLayer({
            source: new TileWMS({
              url,
              params: { ...params, TILED: true },
              gutter: 20,
              attributions: layerModel.attributions,
              tileLoadFunction: function (tile: Tile, src: string) {
                return tileLoadErrorCatchFunction(
                  layer as TileLayer<TileWMS>,
                  tile,
                  src,
                );
              },
            }),
          });
        }
        defer().then(() => emitLayerLoadingStatusSuccess(layer));
      }
      break;

    case "wmts": {
      const olLayer = new TileLayer({});
      const endpoint = new WmtsEndpoint(layerModel.url);
      endpoint
        .isReady()
        .then(async (endpoint) => {
          const layerName = endpoint.getSingleLayerName() ?? layerModel.name;
          const layer = endpoint.getLayerByName(layerName);
          const matrixSet = layer.matrixSets[0];
          const tileGrid = await endpoint.getOpenLayersTileGrid(layer.name);
          if (tileGrid === null) {
            console.warn("A WMTS tile grid could not be created", layerModel);
            return;
          }
          const resourceUrl = layer.resourceLinks[0];
          const dimensions = endpoint.getDefaultDimensions(layer.name);
          olLayer.setSource(
            new WMTS({
              layer: layer.name,
              style: layer.defaultStyle || layer.styles[0].name,
              matrixSet: matrixSet.identifier,
              format: resourceUrl.format,
              url: resourceUrl.url,
              requestEncoding: resourceUrl.encoding,
              referrerPolicy: layerModel.referrerPolicy,
              tileGrid,
              projection: matrixSet.crs,
              dimensions,
              attributions: layerModel.attributions,
            }),
          );
        })
        .then(() => emitLayerLoadingStatusSuccess(olLayer))
        .catch((e) => {
          const httpStatus =
            e instanceof EndpointError ? e.httpStatus : undefined;
          emitLayerLoadingError(olLayer, e, httpStatus);
        });
      layer = olLayer;
      break;
    }

    case "wfs": {
      const olLayer = new VectorLayer({
        style: layerModel.style ?? defaultStyle,
      });
      new WfsEndpoint(layerModel.url)
        .isReady()
        .then((endpoint) => {
          const featureType =
            endpoint.getSingleFeatureTypeName() ?? layerModel.featureType;
          olLayer.setSource(
            new VectorSource({
              format: new GeoJSON(),
              url: function (extent) {
                return endpoint.getFeatureUrl(featureType, {
                  maxFeatures: WFS_MAX_FEATURES,
                  asJson: true,
                  outputCrs: "EPSG:3857",
                  extent: extent as [number, number, number, number],
                  extentCrs: "EPSG:3857",
                });
              },
              strategy: bboxStrategy,
              attributions: layerModel.attributions,
            }),
          );
        })
        .then(() => emitLayerLoadingStatusSuccess(olLayer))
        .catch((e) => {
          const httpStatus =
            e instanceof EndpointError ? e.httpStatus : undefined;
          emitLayerLoadingError(olLayer, e, httpStatus);
        });
      layer = olLayer;
      break;
    }

    case "maplibre-style": {
      layer = new MapboxVectorLayer({
        styleUrl: layerModel.styleUrl,
        accessToken: layerModel.accessToken,
      }) as unknown as Layer;
      defer().then(() => emitLayerLoadingStatusSuccess(layer));
      break;
    }

    case "geojson": {
      layer = new VectorLayer({
        style: layerModel.style ?? defaultStyle,
      });
      let source: VectorSource;
      if (layerModel.url !== undefined) {
        source = new VectorSource({
          format: new GeoJSON(),
          url: layerModel.url,
          attributions: layerModel.attributions,
        });
        source.once("featuresloadend", () =>
          emitLayerLoadingStatusSuccess(layer),
        );
        source.once("featuresloaderror", () =>
          emitLayerLoadingError(
            layer,
            new Error(
              `GeoJSON features could not be loaded from: ${layerModel.url}`,
            ),
          ),
        );
      } else {
        let geojson = layerModel.data;
        try {
          if (typeof geojson === "string") {
            geojson = JSON.parse(geojson);
          }
          const features = GEOJSON.readFeatures(geojson, {
            featureProjection: "EPSG:3857",
            dataProjection: "EPSG:4326",
          }) as Feature<Geometry>[];
          source = new VectorSource({
            features,
            attributions: layerModel.attributions,
          });
          defer().then(() => emitLayerLoadingStatusSuccess(layer));
        } catch (e) {
          console.warn(
            "GeoJSON layer data could not be parsed/read",
            layerModel,
            e,
          );
          source = new VectorSource({
            features: [],
            attributions: layerModel.attributions,
          });
          const err = e instanceof Error ? e : new Error(String(e));
          defer().then(() => emitLayerLoadingError(layer, err));
        }
      }
      layer.setSource(source);
      break;
    }

    case "ogcapi": {
      const ogcEndpoint = new OgcApiEndpoint(layerModel.url);
      let layerUrl: string;
      try {
        if (layerModel.useTiles) {
          if (layerModel.useTiles === "vector") {
            layerUrl = await ogcEndpoint.getVectorTilesetUrl(
              layerModel.collection,
              layerModel.tileMatrixSet,
            );
            layer = new VectorTileLayer({
              source: new OGCVectorTile({
                url: layerUrl,
                format: new MVT(),
                attributions: layerModel.attributions,
              }),
            });
          } else if (layerModel.useTiles === "map") {
            layerUrl = await ogcEndpoint.getMapTilesetUrl(
              layerModel.collection,
              layerModel.tileMatrixSet,
            );
            layer = new TileLayer({
              source: new OGCMapTile({
                url: layerUrl,
                attributions: layerModel.attributions,
              }),
            });
          }
        } else {
          layerUrl = await ogcEndpoint.getCollectionItemsUrl(
            layerModel.collection,
            layerModel.options,
          );
          layer = new VectorLayer({
            source: new VectorSource({
              format: new GeoJSON(),
              url: layerUrl,
              attributions: layerModel.attributions,
            }),
            style: layerModel.style ?? defaultStyle,
          });
        }
        defer().then(() => emitLayerLoadingStatusSuccess(layer));
      } catch (e) {
        if (layerModel.useTiles === "vector") {
          layer = new VectorTileLayer({
            properties: { [`${GEOSPATIAL_SDK_PREFIX}layer-with-error`]: true },
          });
        } else if (layerModel.useTiles === "map") {
          layer = new TileLayer({
            properties: { [`${GEOSPATIAL_SDK_PREFIX}layer-with-error`]: true },
          });
        } else {
          layer = new VectorLayer({
            style: layerModel.style ?? defaultStyle,
            properties: { [`${GEOSPATIAL_SDK_PREFIX}layer-with-error`]: true },
          });
        }
        const httpStatus =
          e instanceof EndpointError ? e.httpStatus : undefined;
        const err = e instanceof Error ? e : new Error(String(e));
        defer().then(() => emitLayerLoadingError(layer, err, httpStatus));
      }
      break;
    }

    case "geotiff": {
      const geoTiffSource = new GeoTIFF({
        sources: [{ url: layerModel.url }],
        convertToRGB: "auto",
      });
      layer = new WebGLTileLayer({
        source: geoTiffSource,
      });
      // FIXME: actually track tile loading
      defer().then(() => emitLayerLoadingStatusSuccess(layer));
      break;
    }

    default: {
      // we create an empty placeholder layer so that we still have a corresponding layer in OL
      layer = new VectorLayer({
        properties: {
          [`${GEOSPATIAL_SDK_PREFIX}layer-with-error`]: true,
        },
      });
      defer().then(() =>
        emitLayerCreationError(
          layer,
          new Error(`Unrecognized layer type: ${JSON.stringify(layerModel)}`),
        ),
      );
    }
  }

  updateLayerProperties(layerModel, layer!);

  return layer!;
}
