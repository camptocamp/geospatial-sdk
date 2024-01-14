import type { FeatureCollection } from 'geojson'


export interface MapContextLayerWms {
  type: 'wms'
  url: string
  name: string
}

export interface MapContextLayerWmts {
  type: 'wmts'
  url: string
  name: string
}

interface MapContextLayerWfs {
  type: 'wfs'
  url: string
  name: string
}

interface MapContextLayerXyz {
  type: 'xyz'
  url: string
}

interface LayerGeojson {
  type: 'geojson'
}
interface LayerGeojsonWithUrl extends LayerGeojson {
  url: string
  data?: never
}
interface LayerGeojsonWithData extends LayerGeojson {
  data: FeatureCollection | string
  url?: never
}
export type MapContextLayerGeojson =
  | LayerGeojsonWithUrl
  | LayerGeojsonWithData

export type MapContextLayer =
  | MapContextLayerWms
  | MapContextLayerWmts
  | MapContextLayerWfs
  | MapContextLayerXyz
  | MapContextLayerGeojson

export type Coordinate = [number, number]

/**
 * Min X, min Y, max X, max Y
 */
export type Extent = [number, number, number, number]

/**
 * @property center Expressed in longitude/latitude
 * @property extent Expressed in longitude/latitude
 * @property maxExtent Expressed in longitude/latitude
 */
export interface MapContextView {
  center: Coordinate
  zoom: number
  extent?: Extent
  maxZoom?: number
  maxExtent?: Extent
}

export interface MapContext {
  layers: MapContextLayer[]
  view: MapContextView
}
