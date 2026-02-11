import { Coordinate, Extent } from "./map-context.js";

export type MapLayerCreationStatus =
  | {
      created: true;
    }
  | {
      creationError: true;
      creationErrorMessage: string;
    };

export type MapLayerLoadingStatus =
  | {
      loaded: true;
    }
  | {
      loadingError: true;
      loadingErrorMessage: string;
      loadingErrorHttpStatus?: number;
    }
  | {
      loading: true;
    };

export interface MapLayerDataInfo {
  featuresCount?: number;
  geometryTypes?: Array<"Point" | "LineString" | "Polygon">;
}

export type ResolvedMapLayerState = MapLayerCreationStatus &
  MapLayerLoadingStatus &
  MapLayerDataInfo;

/**
 * Describes the actual view state of a map
 */
export interface ResolvedMapViewState {
  /** View center in longitude/latitude */
  center: Coordinate;

  /** Actual view extent in longitude/latitude */
  extent: Extent;

  /** Map units per pixel */
  resolution: number;

  /** Scale denominator (takes into account an estimated DPI) */
  scaleDenominator: number;

  /** Bearing in degrees; 90 is North (up) */
  bearing: number;
}

/**
 * Describes the actual state of a map after a context or context diff was applied to it.
 * A `view` of null means the view state hasn't been changed yet.
 * A `layer` item of null means the layer state hasn't been changed yet.
 */
export interface ResolvedMapState {
  layers: Array<ResolvedMapLayerState | null>;
  view: ResolvedMapViewState | null;
}
