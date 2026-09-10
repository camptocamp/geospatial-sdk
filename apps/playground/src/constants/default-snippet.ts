// export const DEFAULT_SNIPPET = `import { createMapFromContext } from '@geospatial-sdk/openlayers'
//
// const context = {
//   view: {
//     center: [6.6323, 46.5197], // lon/lat — Lausanne
//     zoom: 12,
//   },
//   layers: [
//     {
//       type: 'xyz',
//       url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
//       attributions: '© OpenStreetMap contributors',
//     },
//   ],
// }
//
// createMapFromContext(context, 'map')
// `;

export const DEFAULT_SNIPPET = `/**
 * - ADDING AND REMOVING LAYERS IN A MAP -
 * 
 * This example demonstrates how layers can be easily removed from a map
 * using the 'removeLayerFromContext' and 'addLayerToContext' utilities from the SDK.
 *
 * Notice how layers aren't just made visible or hidden, but actually added and removed
 * from the map.
 * Tiles and images are reloaded each time, and the layer order changes depending on
 * the order in which buttons were clicked.
 */

import Map from 'ol/Map'
import { applyContextDiffToMap, createMapFromContext } from '@geospatial-sdk/openlayers'
import { computeMapContextDiff, getLayerPosition, removeLayerFromContext, addLayerToContext } from '@geospatial-sdk/core'

const LAYERS = [
  {
    type: 'wms',
    label: 'layer over France',
    url: 'https://data.geopf.fr/wms-r/wms',
    name: 'INSEE.FILOSOFI.POPULATION'
  },
  {
    type: 'wms',
    label: 'layer over Germany',
    url: 'https://sgx.geodatenzentrum.de/wms_basemapde_schummerung',
    name: 'de_basemapde_web_raster_combshade',
    useTiles: false
  },
  {
    type: 'xyz',
    label: 'satellite layer',
    url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=get_your_own_D6rA4zTHduk6KOKTXzGB'
  },
  {
    type: 'geojson',
    label: 'France regions',
    url: 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/refs/heads/master/regions.geojson',
    hoverable: true,
    clickable: false
  }
]

let context = {
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
};
const layerStates = [false, false, false];

const map = createMapFromContext(context, document.getElementById("map"));

function toggleLayer(layerIndex) {
  const layer = LAYERS[layerIndex];
  const enabled = layerStates[layerIndex];
  const newContext = enabled ? removeLayerFromContext(context, layer) : addLayerToContext(context, layer);
  layerStates[layerIndex] = !enabled
  applyContextDiffToMap(map, computeMapContextDiff(newContext, context))
  context = newContext
}

document.querySelectorAll('.toggle-layer').forEach((btn, index) => {
  const layer = LAYERS[index];
  btn.textContent = \`Add \${layer.label}\`
  btn.addEventListener('click', () => {
    toggleLayer(index);
    btn.textContent = \`\${layerStates[index] ? "Remove" : "Add"} \${layer.label}\`
  });
});
`;
