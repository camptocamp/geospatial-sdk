const name = "Using MapLibre";
const js = `import { createMapFromContext } from '@geospatial-sdk/maplibre'

const layers = {
  maplibre: {
    type: 'maplibre-style',
    styleUrl: 'https://demo.baremaps.com/style.json',
    accessToken: 'abcdefgh'
  },
  wms: {
    type: 'wms',
    url: 'https://data.geopf.fr/wms-r/wms',
    name: 'INSEE.FILOSOFI.POPULATION'
  },
  wfs: {
    type: 'wfs',
    url: 'https://data.lillemetropole.fr/geoserver/dsp_ilevia/ows?REQUEST=GetCapabilities&SERVICE=WFS&VERSION=2.0.0',
    featureType: 'ilevia_traceslignes',
    label: 'Tracé des lignes de bus',
    visibility: true,
    attributions: 'camptocamp',
    opacity: 0.5
  },
  geojson: {
    id: 'geojson',
    type: 'geojson',
    url: 'https://data.lillemetropole.fr/data/ogcapi/collections/roubaix:implantation_des_arceaux_velos_a_roubaix/items?f=geojson&limit=-1'
  },
  ogcapi: {
    type: 'ogcapi',
    url: 'https://data.lillemetropole.fr/data/ogcapi/collections/ilevia:abris_velo/items?f=json&limit=-1',
    collection: 'ilevia:abris_velo'
  }
}

createMapFromContext(
  {
    view: {
      zoom: 10,
      center: [3.1626248124366176, 50.67829080457065]
    },
    layers: Object.values(layers)
  },
  { container: document.getElementById('map') }
)
`;
const html = `<div id="map"></div>
`;

export const example = { name, js, html };
