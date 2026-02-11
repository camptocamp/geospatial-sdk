import Map from "ol/Map.js";
import MapEvent from "ol/MapEvent.js";
import { toLonLat } from "ol/proj.js";
import {
  FeaturesClickEventType,
  FeaturesHoverEventType,
  LayerCreationErrorEventType,
  LayerLoadingErrorEventType,
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
  registerLayerCreationErrorEvent,
  registerLayerLoadingErrorEvent,
  registerMapLayerStateChangeEvent,
  registerMapStateChangeEvent,
  registerMapViewStateChangeEvent,
  registerSourceLoadErrorEvent,
} from "./register-events.js";

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
      registerMapStateChangeEvent(map);
      addEventListener(map, eventType, callback);
      break;
    case LayerCreationErrorEventType:
      registerLayerCreationErrorEvent(map);
      addEventListener(map, eventType, callback);
      break;
    case LayerLoadingErrorEventType:
      registerLayerLoadingErrorEvent(map);
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
      registerSourceLoadErrorEvent(map);
      map.on(SourceLoadErrorType, (event: SourceLoadErrorEvent) =>
        callback(event as MapEventsByType[T]),
      );
      break;
    }
    default:
      throw new Error(`Unrecognized event type: ${eventType}`);
  }
}
