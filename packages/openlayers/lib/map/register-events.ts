import Map, { MapObjectEventTypes } from "ol/Map.js";
import {
  FeaturesClickEventType,
  FeaturesHoverEventType,
  MapClickEventType,
  MapEventsByType,
  MapExtentChangeEventType,
  SourceLoadErrorType,
} from "@geospatial-sdk/core";
import { toLonLat, transformExtent } from "ol/proj.js";
import BaseEvent from "ol/events/Event.js";
import Layer from "ol/layer/Layer.js";
import { BaseLayerObjectEventTypes } from "ol/layer/Base.js";
import { equals } from "ol/extent.js";
import { readFeaturesAtPixel } from "./get-features.js";

function registerFeatureClickEvent(map: Map) {
  if (map.get(FeaturesClickEventType)) return;

  map.on("click", async (event: any) => {
    const features = await readFeaturesAtPixel(map, event);
    map.dispatchEvent({
      type: FeaturesClickEventType,
      features,
    } as unknown as BaseEvent);
  });

  map.set(FeaturesClickEventType, true);
}

function registerFeatureHoverEvent(map: Map) {
  if (map.get(FeaturesHoverEventType)) return;
  map.set(FeaturesHoverEventType, true);
}

function registerMapExtentChangeEvent(map: Map) {
  if (map.get(MapExtentChangeEventType)) return;

  let lastExtent: number[] | null = null;

  const handleExtentChange = () => {
    const extent = map.getView().calculateExtent(map.getSize());
    const reprojectedExtent = transformExtent(
      extent,
      map.getView().getProjection(),
      "EPSG:4326",
    );

    if (lastExtent && equals(lastExtent, reprojectedExtent)) {
      return;
    }

    lastExtent = reprojectedExtent;

    map.dispatchEvent({
      type: MapExtentChangeEventType,
      extent: reprojectedExtent,
    } as unknown as BaseEvent);
  };

  map.getView().on("change:center", handleExtentChange);
  map.getView().on("change:resolution", handleExtentChange);
  map.getView().on("change:rotation", handleExtentChange);
  map.on("change:size", handleExtentChange);

  map.set(MapExtentChangeEventType, true);
}

export function listen<T extends keyof MapEventsByType>(
  map: Map,
  eventType: T,
  callback: (event: MapEventsByType[T]) => void,
) {
  switch (eventType) {
    case FeaturesClickEventType:
      registerFeatureClickEvent(map);
      // we're using a custom event type here so we need to cast to unknown first
      map.on(eventType as unknown as MapObjectEventTypes, (event: any) => {
        (callback as (event: unknown) => void)(event);
      });
      break;
    case FeaturesHoverEventType:
      registerFeatureHoverEvent(map);
      // see comment above
      map.on(eventType as unknown as MapObjectEventTypes, (event: any) => {
        (callback as (event: unknown) => void)(event);
      });
      break;
    case MapClickEventType:
      map.on("click", (event: any) => {
        const coordinate = toLonLat(
          event.coordinate,
          map.getView().getProjection(),
        ) as [number, number];
        (callback as (event: unknown) => void)({
          type: "map-click",
          coordinate,
        });
      });
      break;
    case MapExtentChangeEventType:
      registerMapExtentChangeEvent(map);
      // see comment above
      map.on(eventType as unknown as MapObjectEventTypes, (event: any) => {
        (callback as (event: unknown) => void)(event);
      });
      break;
    case SourceLoadErrorType: {
      const errorCallback = (event: BaseEvent) => {
        (callback as (event: unknown) => void)(event);
      };
      //attach event listener to all existing layers
      map.getLayers().forEach((layer) => {
        if (layer) {
          layer.on(
            SourceLoadErrorType as unknown as BaseLayerObjectEventTypes,
            errorCallback,
          );
        }
      });
      //attach event listener when layer is added
      map.getLayers().on("add", (event: any) => {
        const layer = event.element as Layer;
        if (layer) {
          layer.on(
            SourceLoadErrorType as unknown as BaseLayerObjectEventTypes,
            errorCallback,
          );
        }
      });
      //remove event listener when layer is removed
      map.getLayers().on("remove", (event: any) => {
        const layer = event.element as Layer;
        if (layer) {
          layer.un(
            SourceLoadErrorType as unknown as BaseLayerObjectEventTypes,
            errorCallback,
          );
        }
      });
      break;
    }
    default:
      throw new Error(`Unrecognized event type: ${eventType}`);
  }
}
