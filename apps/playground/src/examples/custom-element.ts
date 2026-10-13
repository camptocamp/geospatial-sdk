const name = "Web Component";
const js = `/**
 * - WEB COMPONENT -
 * 
 * This example demonstrates how to use the SDK with a simple Web Component. It only requires including the
 * script and then using the <geosdk-map> tag in the HTML. The map is configured using the "context" property.
 */
 
import '@geospatial-sdk/elements'

const geosdkMap = document.getElementById('map')
geosdkMap.context = {
  layers: [
    {
      type: 'maplibre-style',
      styleUrl:
        'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json'
    }
  ],
  view: {
    zoom: 12,
    center: [2.33, 48.86]
  }
}
`;

const html = `<geosdk-map id="map"></geosdk-map>`;

export const example = { name, js, html };
