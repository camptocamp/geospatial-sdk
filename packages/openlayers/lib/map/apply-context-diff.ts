import Map from "ol/Map.js";
import { MapContextDiff } from "@geospatial-sdk/core";
import {
  createView,
  getMapUpdatesPromise,
  updateLayerInMap,
} from "./create-map.js";
import { fromLonLat, transformExtent } from "ol/proj.js";
import GeoJSON from "ol/format/GeoJSON.js";
import SimpleGeometry from "ol/geom/SimpleGeometry.js";
import { propagateLayerStateChangeEventToMap } from "./register-events.js";
import { createLayer } from "./layer-creation.js";
import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";

const GEOJSON = new GeoJSON();

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
  const newChain = getMapUpdatesPromise(map).then(async () => {
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
        createLayer(layerAdded.layer),
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
          layerChanged.layer,
          layerChanged.position,
          layerChanged.previousLayer,
        ),
      ),
    );

    if (typeof contextDiff.viewChanges !== "undefined") {
      const { viewChanges } = contextDiff;
      const view = map.getView();
      const projection = view.getProjection();
      if (viewChanges === null) {
        map.setView(createView(viewChanges, map));
        return map;
      }
      if (viewChanges.maxZoom) {
        view.setMaxZoom(viewChanges.maxZoom);
      }
      if ("geometry" in viewChanges) {
        const geom = GEOJSON.readGeometry(viewChanges.geometry, {
          dataProjection: "EPSG:4326",
          featureProjection: projection,
        });
        view.fit(geom as SimpleGeometry, {
          size: map.getSize(),
        });
      } else if ("extent" in viewChanges) {
        view.fit(transformExtent(viewChanges.extent, "EPSG:4326", projection), {
          size: map.getSize(),
        });
      } else {
        const { center: centerInViewProj, zoom } = viewChanges;
        const center = centerInViewProj
          ? fromLonLat(centerInViewProj, projection)
          : [0, 0];
        view.setCenter(center);
        view.setZoom(zoom);
        // TODO: factorize this better
        // if (viewChanges.maxExtent) {
        //   map.setView(new View({
        //
        //   }))
        // }
      }
    }
  });
  map.set(`${GEOSPATIAL_SDK_PREFIX}apply-layer-promise-chain`, newChain);

  return map;
}
