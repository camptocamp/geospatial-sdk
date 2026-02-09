import { EndpointError } from "@camptocamp/ogc-client";
import { Feature } from "geojson";
import BaseEvent from "ol/events/Event.js";
import type { Extent } from "ol/extent.js";
import {
  ResolvedMapLayerState,
  ResolvedMapState,
  ResolvedMapViewState,
} from "./resolved-map-state.js";

export type FeaturesByLayerIndex = Map<number, Feature[]>;

export const FeaturesClickEventType = "features-click";
export interface FeaturesClickEvent {
  type: typeof FeaturesClickEventType;
  features: Feature[];
  featuresByLayer: FeaturesByLayerIndex;
}

export const FeaturesHoverEventType = "features-hover";
export interface FeaturesHoverEvent {
  type: typeof FeaturesHoverEventType;
  features: Feature[];
  featuresByLayer: FeaturesByLayerIndex;
}

export const MapClickEventType = "map-click";
export interface MapClickEvent {
  type: typeof MapClickEventType;
  coordinate: [number, number]; // expressed in lon/lat
}

export const MapViewStateChangeEventType = "map-view-state-change";
export interface MapViewStateChangeEvent {
  type: typeof MapViewStateChangeEventType;
  viewState: ResolvedMapViewState;
}

export const MapLayerStateChangeEventType = "map-layer-state-change";
export interface MapLayerStateChangeEvent {
  type: typeof MapLayerStateChangeEventType;
  layerState: ResolvedMapLayerState;
  layerIndex: number;
}

export const MapStateChangeEventType = "map-state-change";
export interface MapStateChangeEvent {
  type: typeof MapStateChangeEventType;
  mapState: ResolvedMapState;
}

export const LayerCreationErrorEventType = "layer-creation-error";
export interface LayerCreationErrorEvent {
  type: typeof LayerCreationErrorEventType;
  error: Error;
}

/**
 * DEPRECATED
 * Use the MapViewStateEvent instead
 */
export const MapExtentChangeEventType = "map-extent-change";
export interface MapExtentChangeEvent {
  type: typeof MapExtentChangeEventType;
  extent: Extent;
}

/**
 * DEPRECATED
 * Use the MapStateEvent instead
 */
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
  [MapViewStateChangeEventType]: MapViewStateChangeEvent;
  [MapLayerStateChangeEventType]: MapLayerStateChangeEvent;
  [MapStateChangeEventType]: MapStateChangeEvent;
  [LayerCreationErrorEventType]: LayerCreationErrorEvent;
  /**
   * DEPRECATED
   */
  [MapExtentChangeEventType]: MapExtentChangeEvent;
  [SourceLoadErrorType]: SourceLoadErrorEvent;
}
