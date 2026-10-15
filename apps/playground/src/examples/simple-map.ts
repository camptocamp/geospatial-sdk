const name = "Creating a simple map";
const js = `/**
 * - SIMPLE MAP -
 * 
 * This example demonstrates how to create a simple map using the SDK and OpenLayers.
 */
 
 import { createMapFromContext } from '@geospatial-sdk/openlayers'

createMapFromContext(
  {
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
  },
  'map'
)
`;
const html = `<div id="map"></div>
`;

export const example = { name, js, html };
