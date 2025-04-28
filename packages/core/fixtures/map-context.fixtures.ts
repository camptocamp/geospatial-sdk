import { FEATURE_COLLECTION_POLYGON_FIXTURE_4326 } from "./geojson.fixtures";
import {
  Extent,
  MapContext,
  MapContextLayerGeojson,
  MapContextLayerMapLibreStyle,
  MapContextLayerOgcApi,
  MapContextLayerWfs,
  MapContextLayerWms,
  MapContextLayerWmts,
  MapContextLayerXyz,
  MapContextView,
} from "../lib/model";
import { deepFreeze } from "../lib/utils";

export const MAP_CTX_LAYER_XYZ_FIXTURE: MapContextLayerXyz = deepFreeze({
  type: "xyz",
  url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
});
export const MAP_CTX_LAYER_WMS_FIXTURE: MapContextLayerWms = deepFreeze({
  type: "wms",
  url: "https://www.geograndest.fr/geoserver/region-grand-est/ows?REQUEST=GetCapabilities&SERVICE=WMS",
  name: "commune_actuelle_3857",
  label: "Communes",
  visibility: false,
  attributions: "camptocamp",
  opacity: 0.5,
  style: "default",
});
export const MAP_CTX_LAYER_WFS_FIXTURE: MapContextLayerWfs = deepFreeze({
  type: "wfs",
  url: "https://www.geograndest.fr/geoserver/region-grand-est/ows?REQUEST=GetCapabilities&SERVICE=WFS&VERSION=1.1.0",
  featureType: "ms:commune_actuelle_3857",
  label: "Communes",
  visibility: true,
  attributions: "camptocamp",
  opacity: 0.5,
});
export const MAP_CTX_LAYER_WMTS_FIXTURE: MapContextLayerWmts = deepFreeze({
  type: "wmts",
  url: "https://www.geograndest.fr/geoserver/region-grand-est/ows?REQUEST=GetCapabilities&SERVICE=WMTS",
  name: "commune_actuelle_3857",
});
export const MAP_CTX_LAYER_OGCAPI_FIXTURE: MapContextLayerOgcApi = deepFreeze({
  type: "ogcapi",
  url: "https://demo.ldproxy.net/zoomstack/collections/airports/items?f=json",
  collection: "airports",
});
export const MAP_CTX_LAYER_GEOJSON_FIXTURE: MapContextLayerGeojson =
  deepFreeze<MapContextLayerGeojson>({
    type: "geojson",
    data: FEATURE_COLLECTION_POLYGON_FIXTURE_4326,
    label: "Regions",
    opacity: 0.8,
  });
export const MAP_CTX_LAYER_GEOJSON_REMOTE_FIXTURE: MapContextLayerGeojson =
  deepFreeze({
    type: "geojson",
    url: "https://my.host.com/data/regions.json",
  });
export const MAP_CTX_LAYER_MAPBLIBRE_STYLE_FIXTURE: MapContextLayerMapLibreStyle =
  deepFreeze({
    type: "maplibre-style",
    styleUrl: "http://my.host.com/maplibre/style.json",
    accessToken: "abcdefgh",
  });
export const MAP_CTX_LAYER_MVT_FIXTURE: MapContextLayerXyz = deepFreeze({
  type: "xyz",
  url: "https://data.geopf.fr/tms/1.0.0/PLAN.IGN/{z}/{x}/{y}.pbf",
  tileFormat: "application/vnd.mapbox-vector-tile",
  accessToken: "abcdefgh",
});

export const MAP_CTX_VIEW_FIXTURE: MapContextView = deepFreeze({
  center: [7.75, 48.6],
  zoom: 9,
});

export const MAP_CTX_FIXTURE = deepFreeze({
  layers: [
    MAP_CTX_LAYER_XYZ_FIXTURE,
    MAP_CTX_LAYER_WMS_FIXTURE,
    MAP_CTX_LAYER_GEOJSON_FIXTURE,
  ],
  view: MAP_CTX_VIEW_FIXTURE,
});

export const MAP_CTX_EXTENT_FIXTURE: Extent = [1.5, 50.0, 4.2, 52.0];

export const SAMPLE_CONTEXT: MapContext = deepFreeze({
  view: {
    center: [10, 20],
    zoom: 3,
    extent: [40, 50, 60, 70],
  },
  layers: [],
});

export const SAMPLE_LAYER1: MapContextLayerWms = deepFreeze({
  type: "wms",
  url: "http://abc.org/wms",
  name: "myLayer",
  extras: { myField: "abc" },
  label: "My Layer",
  visibility: true,
  attributions: "Attribution",
  opacity: 0.5,
});
export const SAMPLE_LAYER2: MapContextLayerXyz = deepFreeze({
  type: "xyz",
  url: "http://abc.org/tiles",
  extras: { myField2: "123" },
  label: "Tile Layer",
  visibility: true,
  attributions: "Attribution",
  opacity: 0.5,
});
export const SAMPLE_LAYER3: MapContextLayerGeojson = deepFreeze({
  type: "geojson",
  data: '{ "type": "Feature", "properties": {}}',
  extras: { myField3: "000" },
  style: [
    {
      "circle-radius": 3,
      "circle-fill-color": "red",
    },
  ],
});
export const SAMPLE_LAYER4: MapContextLayerWfs = deepFreeze({
  type: "wfs",
  url: "http://abc.org/wfs",
  featureType: "myFeatureType",
  extras: { myField4: "aaa" },
  label: "WFS Layer",
});
export const SAMPLE_LAYER5: MapContextLayerXyz = deepFreeze({
  type: "xyz",
  url: "http://my.tiles/server",
  label: "My XYZ Layer",
});
