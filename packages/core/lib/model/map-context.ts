import { FeatureCollection, Geometry } from "geojson";
import { VectorStyle } from "./style.js";

export type LayerDimensionValueSingle = string | number | Date;
export type LayerDimensionValueRange = {
  start: LayerDimensionValueSingle | null;
  end: LayerDimensionValueSingle | null;
};

/**
 * @private
 * @inline
 */
export type LayerDimensionValues = Record<
  string,
  LayerDimensionValueSingle | LayerDimensionValueRange
>;

/**
 * @private
 * @inline
 */
export type LayerExtras = Record<string, unknown>;

export interface MapContextBaseLayer {
  /**
   * An optional identifier for the layer; if provided, will improve performance when the layers is updated through a context diff.
   */
  id?: string | number;
  /**
   * Optional version indicator; if provided, must be increased by the application for the change detection to trigger, otherwise the SDK will consider that the layer is unchanged.
   */
  version?: number;

  /**
   * This property can be used to store anything application-specific on layers; as its content may occasionally
   * be serialized to JSON for change detection purposes, it is not recommended to store Functions or other
   * non-serializable entities
   */
  extras?: LayerExtras;

  /**
   * Whether the layer is visible or not on the map. A non-visible layer will still have its data queried and kept in memory, so switching this on/off shows immediately on the map.
   *
   * Default value is `true` (visible).
   */
  visibility?: boolean;

  /**
   * Opacity level; between 0 and 1.
   *
   * Default value is 1 (fully opaque).
   */
  opacity?: number;

  /**
   * Optional label for the layer, typically used to represent the layer in a layer list or when showing a popup above a feature.
   */
  label?: string;

  /**
   * Attributions for the layer. Optional but strongly recommended: remember to attribute your map!
   */
  attributions?: string;

  /**
   * Whether data on the layer can be picked up using the `feature-click` event.
   *
   * Default value is `true`. Set to `false` to save performance.
   */
  clickable?: boolean;

  /**
   * Whether features on the layer can be picked up using the `feature-hover` event. Mostly has an effect only for vector layers.
   *
   * Default value is `false`.
   */
  hoverable?: boolean;
}

export interface MapContextLayerWms extends MapContextBaseLayer {
  type: "wms";
  url: string;
  name: string;
  // TODO: add support for these
  dimensionValues?: LayerDimensionValues;
  style?: string;
}

export interface MapContextLayerWmts extends MapContextBaseLayer {
  type: "wmts";
  url: string;
  name: string;
  // TODO: add support for these
  dimensionValues?: LayerDimensionValues;
  style?: string;
}

export interface MapContextLayerVector {
  style?: VectorStyle;
  hoverStyle?: VectorStyle;
}

export type MapContextLayerWfs = MapContextBaseLayer &
  MapContextLayerVector & {
    type: "wfs";
    url: string;
    featureType: string;
  };

export type MapContextLayerOgcApi = MapContextBaseLayer &
  MapContextLayerVector & {
    type: "ogcapi";
    url: string;
    collection: string;
    useTiles?: "vector" | "map";
    tileMatrixSet?: string;
    options?: Record<string, string>;
  };

// Layer pointing to a MapLibre Style spec, see https://maplibre.org/maplibre-style-spec/
export interface MapContextLayerMapLibreStyle extends MapContextBaseLayer {
  type: "maplibre-style";
  styleUrl: string;
  accessToken?: string;
}

export interface MapContextLayerGeotiff extends MapContextBaseLayer {
  type: "geotiff";
  url: string;
}

export interface MapContextLayerXyz extends MapContextBaseLayer {
  type: "xyz";
  url: string;
  tileFormat?: "application/vnd.mapbox-vector-tile"; // If not specified, the system will automatically assume tiles are images.
}

export type LayerGeojson = MapContextBaseLayer &
  MapContextLayerVector & {
    type: "geojson";
  };
export interface LayerGeojsonWithUrl extends LayerGeojson {
  url: string;
  data?: never;
}
export interface LayerGeojsonWithData extends LayerGeojson {
  data: FeatureCollection<Geometry | null> | string;
  url?: never;
}
export type MapContextLayerGeojson = LayerGeojsonWithUrl | LayerGeojsonWithData;

/**
 * A layer that can be used in a map context.
 */
export type MapContextLayer =
  | MapContextLayerWms
  | MapContextLayerWmts
  | MapContextLayerWfs
  | MapContextLayerXyz
  | MapContextLayerGeojson
  | MapContextLayerOgcApi
  | MapContextLayerMapLibreStyle
  | MapContextLayerGeotiff;

export type Coordinate = [number, number];

/**
 * Array components are respectively: minX, minY, maxX, maxY
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
 * @property geometry Expressed in GeoJSON
 */
export interface ViewByGeometry {
  geometry: Geometry;
}

/**
 * A description of a map viewport in one of three ways:
 *  * by center and zoom level,
 *  * by extent,
 *  * by geometry (in GeoJSON)
 *
 * Also allows specifying constraints for zoom and extent.
 */
export type MapContextView = (
  | ViewByZoomAndCenter
  | ViewByExtent
  | ViewByGeometry
) & {
  maxZoom?: number;
  maxExtent?: Extent;
};

/**
 * A map context, containing layers and a view.
 *
 * Note: setting the `view` property to `null` indicates that the map should use a default global view.
 */
export interface MapContext {
  layers: MapContextLayer[];
  view: MapContextView | null;
}
