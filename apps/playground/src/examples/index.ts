import { example as geocodingExample } from "./geocoding.ts";
import { example as mapAddRemoveLayersExample } from "./map-add-remove-layers.ts";
import type { PlaygroundCode } from "../model.js";

export const EXAMPLES: PlaygroundCode[] = [
  mapAddRemoveLayersExample,
  geocodingExample,
];

const packagesRoot = new URL("./geospatial-sdk", window.location.href);
export const DEFAULT_IMPORT_MAP = `{
  "imports": {
    "ol/": "https://unpkg.com/ol@10.10.0/",
    "maplibre-gl": "https://unpkg.com/maplibre-gl@^5.19.0/dist/maplibre-gl.js",
    "earcut": "https://unpkg.com/earcut@^3.0.0",
    "geotiff": "https://unpkg.com/geotiff@^3.1.0-beta.0",
    "pbf": "https://unpkg.com/pbf@5.1.2",
    "rbush": "https://unpkg.com/rbush@^4.0.0/index.js",
    "quickselect": "https://unpkg.com/quickselect@^3.0.0/index.js",
    "zarrita": "https://unpkg.com/zarrita@^0.7.1",
    "@geospatial-sdk/core": "${packagesRoot}/core.js",
    "@geospatial-sdk/legend": "${packagesRoot}/legend.js",
    "@geospatial-sdk/openlayers": "${packagesRoot}/openlayers.js",
    "@geospatial-sdk/maplibre": "${packagesRoot}/maplibre.js",
    "@geospatial-sdk/geocoding": "${packagesRoot}/geocoding.js",
    "@geospatial-sdk/style": "${packagesRoot}/style.js",
    "@geospatial-sdk/elements": "${packagesRoot}/elements.js"
  }
}`;
