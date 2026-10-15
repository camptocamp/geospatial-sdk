const name = "Zooming to a layer";
const js = `import { applyContextDiffToMap, createMapFromContext } from '@geospatial-sdk/openlayers'
import { computeMapContextDiff, createViewFromLayer } from '@geospatial-sdk/core'

const layers = {
  wms: {
    type: 'wms',
    url: 'https://data.geopf.fr/wms-r/wms',
    name: 'CADASTRALPARCELS.HEATMAP'
  },
  wmts: {
    type: 'wmts',
    url: 'https://map.bern.ch/arcgis/rest/services/Geoportal/Hist_Bern_1872/MapServer/WMTS/1.0.0/WMTSCapabilities.xml',
    name: 'Geoportal_Hist_Bern_1872'
  },
  geojson: {
    type: 'geojson',
    url: 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/refs/heads/master/regions.geojson'
  }
}
let context = {
  layers: [
    {
      type: 'xyz',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    },
    layers.wms,
    layers.geojson,
    layers.wmts
  ],
  view: {
    zoom: 5,
    center: [6, 48.5]
  }
}
const map = createMapFromContext(context, document.getElementById('map'))

async function zoomTo(layerName) {
  const view = await createViewFromLayer(layers[layerName])
  if (!view) return
  const newContext = { ...context, view }
  await applyContextDiffToMap(map, computeMapContextDiff(newContext, context))
  context = newContext
}

document.querySelectorAll('[data-layer]').forEach((button) => {
  button.addEventListener('click', () => zoomTo(button.dataset.layer))
})
`;

const html = `<div id="map"></div>
<div class="buttons">
  <button type="button" data-layer="geojson">Zoom to GeoJSON layer</button>
  <button type="button" data-layer="wmts">Zoom to WMTS layer</button>
  <button type="button" data-layer="wms">Zoom to WMS layer</button>
</div>
<style>
  .buttons { position: absolute; z-index: 2; bottom: 16px; left: 16px; display: flex; gap: 12px; }
  .buttons button { padding: 8px 12px; border: 0; border-radius: 4px; background: white; box-shadow: 0 1px 4px #0003; cursor: pointer; }
</style>
`;

export const example = { name, js, html };
