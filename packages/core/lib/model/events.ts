import { EndpointError } from "@camptocamp/ogc-client";
import { Feature } from "geojson";
import BaseEvent from "ol/events/Event.js";
import { Extent } from "ol/extent.js";

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

export const MapExtentChangeEventType = "map-extent-change";
export interface MapExtentChangeEvent {
  type: typeof MapExtentChangeEventType;
  extent: Extent;
}

export const SourceLoadErrorType = "source-load-error";
export class SourceLoadErrorEvent extends BaseEvent {
  message: string;
  httpStatus?: number;
  constructor(error: EndpointError | Error | Response) {
    super(SourceLoadErrorType);
    if (error instanceof Response) {
      this.message = error.statusText;
      this.httpStatus = error.status;
    } else if (
      error instanceof Error &&
      "isCrossOriginRelated" in error &&
      "httpStatus" in error
    ) {
      const e = error as EndpointError;
      this.message = e.message;
      this.httpStatus = e.httpStatus;
    } else {
      this.message = error.message;
    }
  }
}

export interface MapEventsByType {
  [FeaturesClickEventType]: FeaturesClickEvent;
  [FeaturesHoverEventType]: FeaturesHoverEvent;
  [MapClickEventType]: MapClickEvent;
  [MapExtentChangeEventType]: MapExtentChangeEvent;
  [SourceLoadErrorType]: SourceLoadErrorEvent;
}
