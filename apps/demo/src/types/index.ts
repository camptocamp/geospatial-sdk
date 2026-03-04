export type RendererType = 'openlayers' | 'maplibre'

export type LayerType =
  | 'wms'
  | 'wmts'
  | 'wfs'
  | 'xyz'
  | 'geojson'
  | 'ogcapi'
  | 'maplibre-style'
  | 'geotiff'

export interface LayerPreset {
  presetLabel: string
  presetDescription?: string
  layer: import('@geospatial-sdk/core').MapContextLayer
  /** Which renderers support this layer type */
  supportedRenderers: RendererType[]
}
