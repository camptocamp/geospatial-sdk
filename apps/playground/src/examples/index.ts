import { example as geocodingExample } from "./geocoding.ts";
import { example as mapAddRemoveLayersExample } from "./map-add-remove-layers.ts";
import { example as geoTiffExample } from "./geotiff.ts";
import { example as legendExample } from "./legend.ts";
import { example as mapEventsExample } from "./map-events.ts";
import { example as mapLibreExample } from "./map-libre.ts";
import { example as simpleMapExample } from "./simple-map.ts";
import { example as zoomToLayerExample } from "./zoom-to-layer.ts";
import { example as switchProjectionExample } from "./switch-projection.ts";
import { example as customElementExample } from "./custom-element.ts";
import type { PlaygroundCode } from "../model.js";

export const EXAMPLES: PlaygroundCode[] = [
  mapAddRemoveLayersExample,
  geocodingExample,
  simpleMapExample,
  geoTiffExample,
  mapLibreExample,
  mapEventsExample,
  zoomToLayerExample,
  legendExample,
  customElementExample,
  switchProjectionExample,
];

const packagesRoot = new URL("./geospatial-sdk", window.location.href);

// we're building the "geotiff" library as an ESM bundle so that it can be loaded
// as an ES module without loading all its runtime dependencies
const geotiffHref = new URL("./geotiff.esm.js", window.location.href);

export const DEFAULT_IMPORT_MAP = `{
  "imports": {
    "ol/": "https://unpkg.com/ol@10.10.0/",
    "maplibre-gl": "https://unpkg.com/maplibre-gl@^5.19.0/dist/maplibre-gl.js",
    "earcut": "https://unpkg.com/earcut@^3.0.0",
    "ol-mapbox-style": "https://unpkg.com/ol-mapbox-style@^12.4.0/src",
    "pbf": "https://unpkg.com/pbf@5.1.2",
    "rbush": "https://unpkg.com/rbush@^4.0.0/index.js",
    "quickselect": "https://unpkg.com/quickselect@^3.0.0/index.js",
    "zarrita": "https://unpkg.com/zarrita@^0.7.1",
    "@maplibre/maplibre-gl-style-spec": "https://unpkg.com/@maplibre/maplibre-gl-style-spec@23.1.0/dist/gl-style-format.mjs",
    "mapbox-to-css-font": "https://unpkg.com/mapbox-to-css-font@3.1.2",
    "@camptocamp/ogc-client": "https://unpkg.com/@camptocamp/ogc-client@2.0.2/dist/index.js",
    "@rgrove/parse-xml": "https://unpkg.com/@rgrove/parse-xml@5.0.0/dist/browser.js",
    
    "geotiff": "${geotiffHref}",
    
    "@geospatial-sdk/core": "${packagesRoot}/core.js",
    "@geospatial-sdk/legend": "${packagesRoot}/legend.js",
    "@geospatial-sdk/openlayers": "${packagesRoot}/openlayers.js",
    "@geospatial-sdk/maplibre": "${packagesRoot}/maplibre.js",
    "@geospatial-sdk/geocoding": "${packagesRoot}/geocoding.js",
    "@geospatial-sdk/style": "${packagesRoot}/style.js",
    "@geospatial-sdk/elements": "${packagesRoot}/elements.js"
  }
}`;
