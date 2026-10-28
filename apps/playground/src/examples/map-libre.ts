const name = "Using MapLibre";
const js = `/**
 * - SHOWING A GLOBE USING MAPLIBRE -
 * 
 * This example demonstrates how the SDK can be used in conjunction with MapLibre
 * to show a globe in 3D with the usual layer types.
 */

import { createMapFromContext } from '@geospatial-sdk/maplibre'

const layers = [
  {
    type: 'maplibre-style',
    styleUrl: 'https://demo.baremaps.com/style.json'
  },
  {
    type: 'wms',
    url: 'https://data.geopf.fr/wms-r/wms',
    name: 'INSEE.FILOSOFI.POPULATION'
  },
  {
    type: 'wfs',
    url: 'https://data.lillemetropole.fr/geoserver/dsp_ilevia/ows?REQUEST=GetCapabilities&SERVICE=WFS&VERSION=2.0.0',
    featureType: 'ilevia_traceslignes',
    label: 'Tracé des lignes de bus',
    visibility: true,
    attributions: 'camptocamp',
    opacity: 0.5
  },
  {
    type: 'ogcapi',
    url: 'https://data.lillemetropole.fr/geoserver/ogc/features/v1/collections',
    collection: 'dsp_ilevia:abri_velo'
  }
]

const map = createMapFromContext(
  {
    view: {
      zoom: 10,
      center: [3.1626248124366176, 50.67829080457065]
    },
    layers
  },
  { container: document.getElementById('map') }
)
map.on('style.load', () => {
    map.setProjection({
        type: 'globe',
    });
});
`;
const html = `<div id="map"></div>
`;

export const example = { name, js, html };
