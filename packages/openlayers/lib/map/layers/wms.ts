import { getHash, removeSearchParams } from "@geospatial-sdk/core";
import ImageLayer from "ol/layer/Image.js";
import ImageWMS from "ol/source/ImageWMS.js";
import TileLayer from "ol/layer/Tile.js";
import Layer from "ol/layer/Layer.js";
import TileWMS from "ol/source/TileWMS.js";
import Tile from "ol/Tile.js";
import { tileLoadErrorCatchFunction } from "../handle-errors.js";
import {
  MapContextLayerWms,
  TimeInterval,
  ValueInterval,
} from "@geospatial-sdk/core/lib/model/map-context.js";
import { WmsLayerDimensionValue } from "@camptocamp/ogc-client";
import { emitLayerLoadingStatusSuccess } from "../register-events.js";
import { updateLayerProperties } from "../layer-update.js";

// FIXME: this should be better handled in a separate module!
const defer = () => new Promise((resolve) => setTimeout(resolve, 0));

function formatDimensionValues(
  values:
    | Date
    | Date[]
    | TimeInterval
    | "current"
    | WmsLayerDimensionValue
    | WmsLayerDimensionValue[]
    | ValueInterval,
): string {
  if (Array.isArray(values)) {
    return values.map(formatDimensionValues).join(",");
  }
  if (values instanceof Object && "begin" in values && "end" in values) {
    return `${formatDimensionValues(values.begin)}/${formatDimensionValues(values.end)}`;
  }
  if (values instanceof Date) {
    return values.toISOString();
  }
  return values.toString();
}

export function buildWmsParams(
  layerModel: MapContextLayerWms,
): Record<string, unknown> {
  const params = {
    LAYERS: layerModel.name,
    ...(layerModel.format && { FORMAT: layerModel.format }),
    ...(layerModel.style && { STYLES: layerModel.style }),
    ...(layerModel.filter && { FILTER: layerModel.filter }),
    ...(layerModel.customParams ?? {}),
  } as Record<string, unknown>;
  if (layerModel.timeValue !== undefined) {
    params["TIME"] = formatDimensionValues(layerModel.timeValue);
  }
  if (layerModel.elevationValue !== undefined) {
    params["ELEVATION"] = formatDimensionValues(layerModel.elevationValue);
  }
  if (layerModel.otherDimensionValues !== undefined) {
    for (const [key, value] of Object.entries(
      layerModel.otherDimensionValues,
    )) {
      params[`DIM_${key.toUpperCase()}`] = formatDimensionValues(value);
    }
  }
  return params;
}

export function createWmsLayer(layerModel: MapContextLayerWms): Layer {
  const url = removeSearchParams(layerModel.url, ["request", "service"]);
  const params = buildWmsParams(layerModel);
  let layer: Layer;
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
  updateLayerProperties(layerModel, layer!);
  defer().then(() => emitLayerLoadingStatusSuccess(layer));
  return layer;
}

export function updateWmsLayerParams(
  layerModel: MapContextLayerWms,
  previousLayerModel: MapContextLayerWms,
  olLayer: Layer,
) {
  const source = olLayer.getSource() as TileWMS | ImageWMS;
  const params = buildWmsParams(layerModel);
  const previousParams = buildWmsParams(previousLayerModel);

  // no change in params; leave
  if (getHash(params) === getHash(previousParams)) return;

  // set params that were removed to `undefined` to clear them from the requests
  for (const key of Object.keys(previousParams)) {
    if (!(key in params)) {
      params[key] = undefined;
    }
  }

  source.updateParams(params);
}
