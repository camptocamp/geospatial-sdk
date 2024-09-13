import { FeatureCollection, Geometry } from "geojson";
import { VectorStyle } from "./style";

export type LayerDimensions = Record<string, string>;

export type LayerExtras = Record<string, unknown>;

export interface MapContextBaseLayer {
  id?: string | number;
  version?: number;

  /**
   * This property can be used to store anything application-specific on layers; as its content may occasionally
   * be serialized to JSON for change detection purposes, it is not recommended to store Functions or other
   * non-serializable entities
   */
  extras?: LayerExtras;
  visibility?: boolean;
  opacity?: number;
  label?: string;
  attributions?: string;
}

export interface MapContextLayerWms extends MapContextBaseLayer {
  type: "wms";
  url: string;
  name: string;
  dimensions?: LayerDimensions;
  style?: string;
}

export interface MapContextLayerWmts extends MapContextBaseLayer {
  type: "wmts";
  url: string;
  name: string;
  dimensions?: LayerDimensions;
  style?: string;
}

export interface MapContextLayerWfs extends MapContextBaseLayer {
  type: "wfs";
  url: string;
  featureType: string;
  style?: VectorStyle;
}

export interface MapContextLayerOgcApi extends MapContextBaseLayer {
  type: "ogcapi";
  url: string;
  collection: string;
  useTiles?: "vector" | "map";
  tileMatrixSet?: string;
  options?: Record<string, string>;
  style?: VectorStyle;
}

// Layer pointing to a MapLibre Style spec, see https://maplibre.org/maplibre-style-spec/
export interface MapContextLayerMapLibreStyle extends MapContextBaseLayer {
  type: "maplibre-style";
  styleUrl: string;
  accessToken?: string;
}

export interface MapContextLayerXyz extends MapContextBaseLayer {
  type: "xyz";
  url: string;
}

interface LayerGeojson extends MapContextBaseLayer {
  type: "geojson";
  style?: VectorStyle;
}
interface LayerGeojsonWithUrl extends LayerGeojson {
  url: string;
  data?: never;
}
interface LayerGeojsonWithData extends LayerGeojson {
  data: FeatureCollection<Geometry | null> | string;
  url?: never;
}

/**
 * @interface
 */
export type MapContextLayerGeojson = LayerGeojsonWithUrl | LayerGeojsonWithData;

/**
 * @interface
 */
export type MapContextLayer =
  | MapContextLayerWms
  | MapContextLayerWmts
  | MapContextLayerWfs
  | MapContextLayerXyz
  | MapContextLayerGeojson
  | MapContextLayerOgcApi
  | MapContextLayerMapLibreStyle;

export type Coordinate = [number, number];

/**
 * Min X, min Y, max X, max Y
 */
export type Extent = [number, number, number, number];

/**
 * @property center Expressed in longitude/latitude
 * @property zoom
 */
export interface ViewByZoomAndCenter {
  center: Coordinate;
  zoom: number;
}

/**
 * @property extent Expressed in longitude/latitude
 */
export interface ViewByExtent {
  extent: Extent;
}

/**
 * @property geometry Expressed in longitude/latitude
 */
export interface ViewByGeometry {
  geometry: Geometry;
}

export type MapContextView = (
  | ViewByZoomAndCenter
  | ViewByExtent
  | ViewByGeometry
) & {
  maxZoom?: number;
  maxExtent?: Extent;
};

export interface MapContext {
  layers: MapContextLayer[];
  view: MapContextView;
}
