import { Feature } from "geojson";
import BaseEvent from "ol/events/Event";

export const FeaturesClickEventType = "features-click";
export interface FeaturesClickEvent {
  type: typeof FeaturesClickEventType;
  features: Feature[];
}

export const FeaturesHoverEventType = "features-hover";
export interface FeaturesHoverEvent {
  type: typeof FeaturesHoverEventType;
  features: Feature[];
}

export const MapClickEventType = "map-click";
export interface MapClickEvent {
  type: typeof MapClickEventType;
  coordinate: [number, number]; // expressed in lon/lat
}

export interface MapEventsByType {
  [FeaturesClickEventType]: FeaturesClickEvent;
  [FeaturesHoverEventType]: FeaturesHoverEvent;
  [MapClickEventType]: MapClickEvent;
  [SourceLoadErrorType]: SourceLoadErrorEvent;
}

export const SourceLoadErrorType = "source-load-error";
export class SourceLoadErrorEvent extends BaseEvent {
  statusCode: number
  constructor(statusCode: number) {
    super(SourceLoadErrorType)
    this.statusCode = statusCode
  }
}
