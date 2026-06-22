import {
  MapContext,
  MapContextLayer,
  MapContextView,
} from "@geospatial-sdk/core";
import Map from "ol/Map.js";
import View from "ol/View.js";
import Layer from "ol/layer/Layer.js";
import GeoJSON from "ol/format/GeoJSON.js";
import SimpleGeometry from "ol/geom/SimpleGeometry.js";
import { fromLonLat, transformExtent } from "ol/proj.js";
import proj4 from "proj4";
import { register } from "ol/proj/proj4.js";
import {
  canDoIncrementalUpdate,
  updateLayerProperties,
} from "./layer-update.js";
import { initHoverLayer } from "./feature-hover.js";
import { propagateLayerStateChangeEventToMap } from "./register-events.js";
import { createLayer } from "./layer-creation.js";
import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";

// Register proj4 with OpenLayers so that arbitrary EPSG codes
// (e.g., UTM zones from GeoTIFF metadata) can be reprojected to the map projection
register(proj4);

const GEOJSON = new GeoJSON();

export async function updateLayerInMap(
  map: Map,
  layerModel: MapContextLayer,
  layerPosition: number,
  previousLayerModel: MapContextLayer,
): Promise<void> {
  const layers = map.getLayers();
  const updatedLayer = layers.item(layerPosition) as Layer;

  // if an incremental update is possible, do it to avoid costly layer recreation
  if (canDoIncrementalUpdate(previousLayerModel, layerModel)) {
    updateLayerProperties(layerModel, updatedLayer, previousLayerModel);
    return;
  }

  // dispose and recreate layer
  updatedLayer.dispose();
  await createLayer(layerModel).then((layer) => {
    layers.setAt(layerPosition, layer);
    propagateLayerStateChangeEventToMap(map, layer);
  });
}

export function createView(viewModel: MapContextView | null, map: Map): View {
  if (viewModel === null) {
    return new View({
      center: [0, 0],
      zoom: 0,
    });
  }
  const view = new View({
    ...("maxExtent" in viewModel && { extent: viewModel.maxExtent }),
    ...("maxZoom" in viewModel && { maxZoom: viewModel.maxZoom }),
    multiWorld: false,
    constrainResolution: true,
  });
  if ("geometry" in viewModel) {
    const geom = GEOJSON.readGeometry(viewModel.geometry);
    view.fit(geom as SimpleGeometry, {
      size: map.getSize(),
    });
  } else if ("extent" in viewModel) {
    view.fit(
      transformExtent(viewModel.extent, "EPSG:4326", view.getProjection()),
      {
        size: map.getSize(),
      },
    );
  } else {
    const { center: centerInViewProj, zoom } = viewModel;
    const center = centerInViewProj
      ? fromLonLat(centerInViewProj, "EPSG:3857")
      : [0, 0];
    view.setCenter(center);
    view.setZoom(zoom !== undefined ? zoom : 0);
  }
  return view;
}

/**
 * Create an OpenLayers map from a context; optionally specify a target (root element) for the map
 * @param context
 * @param target
 */
export function createMapFromContext(
  context: MapContext,
  target?: string | HTMLElement,
): Map {
  const map = new Map({
    target,
  });
  return resetMapFromContext(map, context);
}

/**
 * Resets an OpenLayers map from a context; existing content will be cleared.
 * The function returns synchronously; all asynchronous modifications are stacked
 * in a promise chain stored on the map.
 * @param map
 * @param context
 */
export function resetMapFromContext(map: Map, context: MapContext): Map {
  map.setView(createView(context.view, map));
  map.getLayers().clear();
  const existingChain: Promise<void> =
    map.get(`${GEOSPATIAL_SDK_PREFIX}apply-layer-promise-chain`) ??
    Promise.resolve();
  map.set(
    `${GEOSPATIAL_SDK_PREFIX}apply-layer-promise-chain`,
    existingChain
      .then(async () => {
        for (const layerModel of context.layers) {
          const layer = await createLayer(layerModel);
          map.addLayer(layer);
          propagateLayerStateChangeEventToMap(map, layer);
        }
      })
      .then(() => {
        initHoverLayer(map);
      }),
  );
  return map;
}

/**
 * This promise will resolve once all pending modifications are done on the map.
 * @param map
 */
export function getMapUpdatesPromise(map: Map): Promise<void> {
  return (
    map.get(`${GEOSPATIAL_SDK_PREFIX}apply-layer-promise-chain`) ??
    Promise.resolve()
  );
}
