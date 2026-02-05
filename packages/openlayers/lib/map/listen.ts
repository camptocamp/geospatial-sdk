import Map from "ol/Map.js";
import MapEvent from "ol/MapEvent.js";
import { toLonLat } from "ol/proj.js";
import {
  FeaturesClickEventType,
  FeaturesHoverEventType,
  MapClickEvent,
  MapClickEventType,
  MapEventsByType,
  MapExtentChangeEvent,
  MapExtentChangeEventType,
  MapLayerStateChangeEventType,
  MapStateChangeEventType,
  MapViewStateChangeEvent,
  MapViewStateChangeEventType,
  SourceLoadErrorEvent,
  SourceLoadErrorType,
} from "@geospatial-sdk/core";
import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";
import {
  registerFeatureClickEvent,
  registerFeatureHoverEvent,
  registerMapLayerStateChangeEvent,
  registerMapViewStateChangeEvent,
} from "./register-events.js";
import { CollectionEvent } from "ol/Collection.js";
import Layer from "ol/layer/Layer.js";

function addEventListener<T extends keyof MapEventsByType>(
  map: Map,
  eventType: T,
  callback: (event: MapEventsByType[T]) => void,
) {
  map.on(
    `${GEOSPATIAL_SDK_PREFIX}${eventType}`,
    ({
      target: _target,
      ...event
    }: MapEventsByType[T] & { target: MapEvent["target"] }) =>
      // we're excluding the `target` property and renaming the `type` here
      callback({
        ...event,
        type: eventType,
      } as MapEventsByType[T]),
  );
}

export function listen<T extends keyof MapEventsByType>(
  map: Map,
  eventType: T,
  callback: (event: MapEventsByType[T]) => void,
) {
  switch (eventType) {
    case FeaturesClickEventType:
      registerFeatureClickEvent(map);
      addEventListener(map, eventType, callback);
      break;
    case FeaturesHoverEventType:
      registerFeatureHoverEvent(map);
      addEventListener(map, eventType, callback);
      break;
    case MapClickEventType:
      map.on("click", (event: MapClickEvent) => {
        const coordinate = toLonLat(
          event.coordinate,
          map.getView().getProjection(),
        ) as [number, number];
        callback({
          type: MapClickEventType,
          coordinate,
        } as MapEventsByType[T]);
      });
      break;
    case MapViewStateChangeEventType:
      registerMapViewStateChangeEvent(map);
      addEventListener(map, eventType, callback);
      break;
    case MapLayerStateChangeEventType:
      registerMapLayerStateChangeEvent(map);
      addEventListener(map, eventType, callback);
      break;
    case MapStateChangeEventType:
      // TODO: registerMapStateChangeEvent(map);
      addEventListener(map, eventType, callback);
      break;

    /**
     * DEPRECATED
     */
    case MapExtentChangeEventType:
      registerMapViewStateChangeEvent(map);
      map.on(
        `${GEOSPATIAL_SDK_PREFIX}${MapViewStateChangeEventType}`,
        (event: MapViewStateChangeEvent) =>
          callback({
            type: MapExtentChangeEventType,
            extent: event.viewState.extent,
          } as MapExtentChangeEvent as MapEventsByType[T]),
      );
      break;
    case SourceLoadErrorType: {
      const errorCallback = (event: SourceLoadErrorEvent) => {
        callback(event as MapEventsByType[T]);
      };
      //attach event listener to all existing layers
      map.getLayers().forEach((layer) => {
        if (layer) {
          layer.on(SourceLoadErrorType, errorCallback);
        }
      });
      //attach event listener when layer is added
      map.getLayers().on("add", (event: CollectionEvent<Layer>) => {
        const layer = event.element;
        if (layer) {
          layer.on(SourceLoadErrorType, errorCallback);
        }
      });
      //remove event listener when layer is removed
      map.getLayers().on("remove", (event: CollectionEvent<Layer>) => {
        const layer = event.element;
        if (layer) {
          layer.un(SourceLoadErrorType, errorCallback);
        }
      });
      break;
    }
    default:
      throw new Error(`Unrecognized event type: ${eventType}`);
  }
}
