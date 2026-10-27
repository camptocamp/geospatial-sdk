import Map from "ol/Map.js";
import {
  CrsIdentifier,
  ensureDiffCrsReady,
  MapContextDiff,
  MapContextLayer,
} from "@geospatial-sdk/core";
import { getMapUpdatesPromise } from "./create-map.js";
import { propagateLayerStateChangeEventToMap } from "./register-events.js";
import { createLayer } from "./layer-creation.js";
import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";
import {
  canChangeViewProjection,
  canDoIncrementalUpdate,
  updateLayerProperties,
} from "./layer-update.js";
import { updateView } from "./view.js";
import Layer from "ol/layer/Layer.js";
import { register } from "ol/proj/proj4.js";
import proj4 from "proj4";

export async function updateViewProjectionForLayer(
  map: Map,
  targetProjection: CrsIdentifier,
  olLayer: Layer,
  layerIndex: number,
): Promise<void> {
  const model = olLayer.get(`${GEOSPATIAL_SDK_PREFIX}layer-model`) as
    MapContextLayer | undefined;
  if (!model) {
    // this layer is most likely not managed by the SDK, move on
    return;
  }
  if (canChangeViewProjection(model)) {
    // this layer can be kept without being recreated
    return;
  }

  olLayer.dispose();
  const newLayer = await createLayer(model, targetProjection);
  map.getLayers().setAt(layerIndex, newLayer);
  propagateLayerStateChangeEventToMap(map, newLayer);
}

export async function updateLayerInMap(
  map: Map,
  targetProjection: CrsIdentifier,
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
  await createLayer(layerModel, targetProjection).then((layer) => {
    layers.setAt(layerPosition, layer);
    propagateLayerStateChangeEventToMap(map, layer);
  });
}

/**
 * Apply a context diff to an OpenLayers map.
 * The function returns synchronously; all asynchronous modifications are stacked
 * in a promise chain stored on the map.
 * @param map
 * @param contextDiff
 */
export function applyContextDiffToMap(
  map: Map,
  contextDiff: MapContextDiff,
): Map {
  const newChain = getMapUpdatesPromise(map)
    .then(() => ensureDiffCrsReady(contextDiff))
    .then(async () => {
      // this will load whatever projections are already registered with proj4 into OL
      register(proj4);

      // let's see if the map projection changed, because this has big implications for layers
      const newProjection =
        contextDiff.viewChanges === null
          ? "EPSG:3857"
          : contextDiff.viewChanges?.projection;
      const viewProjection =
        newProjection ?? map.getView().getProjection().getCode();
      const viewProjectionChanged = newProjection !== undefined;

      // first: if the view projection changed, apply it to the existing layers
      if (viewProjectionChanged) {
        const layers = map.getLayers();
        for (let i = 0; i < layers.getLength(); i++) {
          await updateViewProjectionForLayer(
            map,
            viewProjection,
            layers.item(i) as Layer,
            i,
          );
        }
      }

      const layers = map.getLayers();

      // removed layers (sorted by descending position)
      if (contextDiff.layersRemoved.length > 0) {
        const removed = contextDiff.layersRemoved.sort(
          (a, b) => b.position - a.position,
        );
        for (const layerRemoved of removed) {
          layers.item(layerRemoved.position).dispose();
          layers.removeAt(layerRemoved.position);
        }
      }

      // insert added layers
      const newLayers = await Promise.all(
        contextDiff.layersAdded.map((layerAdded) =>
          createLayer(layerAdded.layer, viewProjection),
        ),
      );

      newLayers.forEach((layer, index) => {
        if (!layer) {
          return;
        }
        const position = contextDiff.layersAdded[index].position;
        if (position >= layers.getLength()) {
          layers.push(layer);
        } else {
          layers.insertAt(position, layer);
        }
        propagateLayerStateChangeEventToMap(map, layer);
      });

      // move reordered layers (sorted by ascending new position)
      if (contextDiff.layersReordered.length > 0) {
        const reordered = contextDiff.layersReordered.sort(
          (a, b) => a.newPosition - b.newPosition,
        );
        const olLayers = reordered.map((layer) =>
          layers.item(layer.previousPosition),
        );
        const layersArray = layers.getArray();
        for (let i = 0; i < reordered.length; i++) {
          layersArray[reordered[i].newPosition] = olLayers[i];
        }
        map.setLayers([...layersArray]);
      }

      // update or recreate changed layers
      await Promise.all(
        contextDiff.layersChanged.map((layerChanged) =>
          updateLayerInMap(
            map,
            viewProjection,
            layerChanged.layer,
            layerChanged.position,
            layerChanged.previousLayer,
          ),
        ),
      );

      if (typeof contextDiff.viewChanges !== "undefined") {
        updateView(contextDiff.viewChanges, map);
      }
      return map;
    });
  map.set(`${GEOSPATIAL_SDK_PREFIX}apply-layer-promise-chain`, newChain);

  return map;
}
