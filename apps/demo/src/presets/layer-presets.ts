import type { LayerPreset, LayerType } from '../types'

// --- WMS presets ---

const wmsPresets: LayerPreset[] = [
  {
    presetLabel: 'Population INSEE (IGN)',
    layer: {
      type: 'wms',
      url: 'https://data.geopf.fr/wms-r/wms',
      name: 'INSEE.FILOSOFI.POPULATION',
      label: 'Population INSEE',
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
  {
    presetLabel: 'Communes (DataGrandEst)',
    layer: {
      type: 'wms',
      url: 'https://www.datagrandest.fr/geoserver/region-grand-est/ows?REQUEST=GetCapabilities&SERVICE=WMS',
      name: 'commune_actuelle_3857',
      label: 'Communes WMS',
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
  {
    presetLabel: 'Bathymetry (EMODnet)',
    layer: {
      type: 'wms',
      url: 'https://ows.emodnet-bathymetry.eu/wms',
      name: 'emodnet:mean_rainbowcolour',
      label: 'Bathymetry',
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
]

// --- WMTS presets ---

const wmtsPresets: LayerPreset[] = [
  {
    presetLabel: 'Communes WMTS (DataGrandEst)',
    layer: {
      type: 'wmts',
      url: 'https://www.datagrandest.fr/geoserver/region-grand-est/ows?REQUEST=GetCapabilities&SERVICE=WMTS',
      name: 'commune_actuelle_3857',
      label: 'Communes WMTS',
    },
    supportedRenderers: ['openlayers'],
  },
  {
    presetLabel: 'Historic Bern 1872',
    layer: {
      type: 'wmts',
      url: 'https://map.bern.ch/arcgis/rest/services/Geoportal/Hist_Bern_1872/MapServer/WMTS/1.0.0/WMTSCapabilities.xml',
      name: 'Geoportal_Hist_Bern_1872',
      label: 'Historic Bern 1872',
    },
    supportedRenderers: ['openlayers'],
  },
]

// --- WFS presets ---

const wfsPresets: LayerPreset[] = [
  {
    presetLabel: 'Bus Lines (Lille)',
    layer: {
      type: 'wfs',
      url: 'https://data.lillemetropole.fr/geoserver/dsp_ilevia/ows?REQUEST=GetCapabilities&SERVICE=WFS&VERSION=2.0.0',
      featureType: 'ilevia_traceslignes',
      label: 'Bus Lines Lille',
      opacity: 0.5,
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
]

// --- XYZ presets ---

const xyzPresets: LayerPreset[] = [
  {
    presetLabel: 'OpenStreetMap',
    layer: {
      type: 'xyz',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      label: 'OpenStreetMap',
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
  {
    presetLabel: 'IGN Plan (MVT)',
    layer: {
      type: 'xyz',
      url: 'https://data.geopf.fr/tms/1.0.0/PLAN.IGN/{z}/{x}/{y}.pbf',
      tileFormat: 'application/vnd.mapbox-vector-tile',
      label: 'IGN Plan MVT',
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
]

// --- GeoJSON presets ---

const geojsonPresets: LayerPreset[] = [
  {
    presetLabel: 'Bike Racks (Roubaix)',
    layer: {
      type: 'geojson',
      url: 'https://data.lillemetropole.fr/data/ogcapi/collections/roubaix:implantation_des_arceaux_velos_a_roubaix/items?f=geojson&limit=-1',
      label: 'Bike Racks Roubaix',
      style: {
        "circle-fill-color": 'rgba(255, 0, 0, 0.5)',
        "circle-stroke-color": 'rgba(255, 0, 0, 1)',
        "circle-stroke-width": 2,
      },
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
  {
    presetLabel: 'France Regions',
    layer: {
      type: 'geojson',
      url: 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/refs/heads/master/regions.geojson',
      label: 'France Regions',
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
  {
    presetLabel: 'Sample Regions (inline)',
    layer: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [2.0, 48.5],
                  [2.5, 48.5],
                  [2.5, 49.0],
                  [2.0, 49.0],
                  [2.0, 48.5],
                ],
              ],
            },
            properties: { name: 'Sample Region' },
          },
        ],
      },
      label: 'Sample Regions',
      opacity: 0.8,
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
]

// --- OGC API presets ---

const ogcapiPresets: LayerPreset[] = [
  {
    presetLabel: 'Airports (ldproxy)',
    layer: {
      type: 'ogcapi',
      url: 'https://demo.ldproxy.net/zoomstack/collections/airports/items?f=json',
      collection: 'airports',
      label: 'Airports',
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
  {
    presetLabel: 'Bike Shelters (Lille)',
    layer: {
      type: 'ogcapi',
      url: 'https://data.lillemetropole.fr/data/ogcapi/collections/ilevia:abris_velo/items?f=json&limit=-1',
      collection: 'ilevia:abris_velo',
      label: 'Bike Shelters',
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
]

// --- MapLibre Style presets ---

const maplibreStylePresets: LayerPreset[] = [
  {
    presetLabel: 'Baremaps Style',
    layer: {
      type: 'maplibre-style',
      styleUrl: 'https://demo.baremaps.com/style.json',
      label: 'Baremaps',
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
  {
    presetLabel: 'CARTO Voyager',
    layer: {
      type: 'maplibre-style',
      styleUrl: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      label: 'CARTO Voyager',
    },
    supportedRenderers: ['openlayers', 'maplibre'],
  },
]

// --- GeoTIFF presets ---

const geotiffPresets: LayerPreset[] = [
  {
    presetLabel: 'Sentinel-2 (Senegal)',
    layer: {
      type: 'geotiff',
      url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
      label: 'Sentinel-2',
    },
    supportedRenderers: ['openlayers'],
  },
]

// --- Exports ---

export const layerPresets: LayerPreset[] = [
  ...wmsPresets,
  ...wmtsPresets,
  ...wfsPresets,
  ...xyzPresets,
  ...geojsonPresets,
  ...ogcapiPresets,
  ...maplibreStylePresets,
  ...geotiffPresets,
]

export const layerTypes: { type: LayerType; label: string }[] = [
  { type: 'wms', label: 'WMS' },
  { type: 'wmts', label: 'WMTS' },
  { type: 'wfs', label: 'WFS' },
  { type: 'xyz', label: 'XYZ Tiles' },
  { type: 'geojson', label: 'GeoJSON' },
  { type: 'ogcapi', label: 'OGC API' },
  { type: 'maplibre-style', label: 'MapLibre Style' },
  { type: 'geotiff', label: 'GeoTIFF' },
]

export function getPresetsForType(type: LayerType): LayerPreset[] {
  return layerPresets.filter((preset) => preset.layer.type === type)
}
