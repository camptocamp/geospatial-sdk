import { Feature } from "geojson";

export const FeaturesClickEventType = "features-click";
export interface FeaturesClickEvent {
  features: Feature[];
}

export const FeaturesHoverEventType = "features-hover";
export interface FeaturesHoverEvent {
  features: Feature[];
}

export const MapClickEventType = "map-click";
export interface MapClickEvent {
  coordinate: [number, number]; // expressed in lon/lat
}

export type MapEvent = FeaturesClickEvent | FeaturesHoverEvent | MapClickEvent;

export type MapEventType =
  | typeof FeaturesClickEventType
  | typeof FeaturesHoverEventType
  | typeof MapClickEventType;
