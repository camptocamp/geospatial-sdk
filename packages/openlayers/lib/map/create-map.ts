import { ensureContextCrsReady, MapContext } from "@geospatial-sdk/core";
import Map from "ol/Map.js";
import proj4 from "proj4";
import { register } from "ol/proj/proj4.js";
import { initHoverLayer } from "./feature-hover.js";
import { propagateLayerStateChangeEventToMap } from "./register-events.js";
import { createLayer } from "./layer-creation.js";
import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";
import { createView } from "./view.js";

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
  map.getLayers().clear();
  const existingChain: Promise<void> =
    map.get(`${GEOSPATIAL_SDK_PREFIX}apply-layer-promise-chain`) ??
    Promise.resolve();
  map.set(
    `${GEOSPATIAL_SDK_PREFIX}apply-layer-promise-chain`,
    existingChain
      .then(() => ensureContextCrsReady(context))
      .then(async () => {
        // this will load whatever projections are already registered with proj4 into OL
        register(proj4);

        const viewProjection = context.view?.projection ?? "EPSG:3857";
        map.setView(createView(context.view, map));
        for (const layerModel of context.layers) {
          const layer = await createLayer(layerModel, viewProjection);
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
