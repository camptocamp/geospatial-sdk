import type { MapContext } from '@geospatial-sdk/core'

export const DEFAULT_CONTEXT: MapContext = {
  layers: [
    {
      type: 'xyz',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
  ],
  view: {
    zoom: 5,
    center: [6, 48.5]
  }
}
