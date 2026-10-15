const name = "Displaying a GeoTIFF";
const js = `/**
 * - DISPLAYING A GEOTIFF -
 * 
 * This example demonstrates how to add a GeoTIFF layer to the map.
 */
 
import { createMapFromContext } from '@geospatial-sdk/openlayers'

createMapFromContext(
  {
    layers: [
      {
        type: 'xyz',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      },
      {
        type: 'geotiff',
        url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif'
      }
    ],
    view: {
      zoom: 9,
      center: [33.55, 16.69]
    }
  },
  'map'
)
`;

const html = `<div id="map"></div>`;

export const example = { name, js, html };
