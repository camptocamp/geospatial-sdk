import { Feature } from "geojson";
import {
  ResolvedMapLayerState,
  ResolvedMapState,
  ResolvedMapViewState,
} from "./resolved-map-state.js";
import { Extent } from "./map-context.js";

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
  layerId?: string | number;
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

export const LayerLoadingErrorEventType = "layer-loading-error";
export interface LayerLoadingErrorEvent {
  type: typeof LayerLoadingErrorEventType;
  error: Error;
  httpStatus?: number;
}

/**
 * DEPRECATED
 * Use the MapViewStateChangeEvent instead
 */
export const MapExtentChangeEventType = "map-extent-change";
export interface MapExtentChangeEvent {
  type: typeof MapExtentChangeEventType;
  extent: Extent;
}

/**
 * DEPRECATED
 * Use the MapLayerStateChangeEvent and LayerLoadingErrorEvent instead
 */
export const SourceLoadErrorType = "source-load-error";
export class SourceLoadErrorEvent {
  type: typeof SourceLoadErrorType;
  message: string;
  httpStatus?: number;
  constructor(error: Error | Response) {
    this.type = SourceLoadErrorType;
    if (error instanceof Response) {
      this.message = error.statusText;
      this.httpStatus = error.status;
      // } else if (error instanceof EndpointError) {
    } else if ("httpStatus" in error) {
      this.message = error.message;
      this.httpStatus = error.httpStatus as number;
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
  [LayerLoadingErrorEventType]: LayerLoadingErrorEvent;
  /**
   * DEPRECATED
   */
  [MapExtentChangeEventType]: MapExtentChangeEvent;
  [SourceLoadErrorType]: SourceLoadErrorEvent;
}
