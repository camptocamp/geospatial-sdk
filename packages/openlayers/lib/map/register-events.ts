import Map, { MapObjectEventTypes } from "ol/Map";
import {
  FeaturesClickEventType,
  FeaturesHoverEventType,
  MapClickEventType,
  MapEvent,
  MapEventType,
} from "@geospatial-sdk/core";
import { toLonLat } from "ol/proj";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import { Pixel } from "ol/pixel";
import BaseEvent from "ol/events/Event";

const GEOJSON = new GeoJSON();

function readFeaturesAtPixel(map: Map, pixel: Pixel) {
  const olFeatures = map.getFeaturesAtPixel(pixel);
  if (!olFeatures) {
    return [];
  }
  const { features } = GEOJSON.writeFeaturesObject(olFeatures as Feature[]);
  return features;
}

function registerFeatureClickEvent(map: Map) {
  if (map.get(FeaturesClickEventType)) return;
  map.on("click", (event) => {
    const features = readFeaturesAtPixel(map, event.pixel);
    map.dispatchEvent({
      type: FeaturesClickEventType,
      features,
    } as unknown as BaseEvent);
  });
  map.set(FeaturesClickEventType, true);
}

function registerFeatureHoverEvent(map: Map) {
  if (map.get(FeaturesHoverEventType)) return;
  map.on("pointermove", (event) => {
    const features = readFeaturesAtPixel(map, event.pixel);
    map.dispatchEvent({
      type: FeaturesHoverEventType,
      features,
    } as unknown as BaseEvent);
  });
  map.set(FeaturesHoverEventType, true);
}

export function listen(
  map: Map,
  event: MapEventType,
  callback: (event: MapEvent) => void,
) {
  switch (event) {
    case FeaturesClickEventType:
      registerFeatureClickEvent(map);
      map.on(event as unknown as MapObjectEventTypes, (event) => {
        callback(event as unknown as MapEvent);
      });
      break;
    case FeaturesHoverEventType:
      registerFeatureHoverEvent(map);
      map.on(event as unknown as MapObjectEventTypes, (event) => {
        callback(event as unknown as MapEvent);
      });
      break;
    case MapClickEventType:
      map.on("click", (event) => {
        const coordinate = toLonLat(
          event.pixel,
          map.getView().getProjection(),
        ) as [number, number];
        callback({ coordinate });
      });
      break;
    default:
      throw new Error(`Unrecognized event type: ${event}`);
  }
}
