const name = "Displaying and switching WMS legends";
const js = `/**
 * - LEGENDS -
 * 
 * This example demonstrates how the "geospatial-sdk/legend" package can be used
 * to display legends for WMS layers and switch them dynamically when the style of the layer changes.
 */

import { applyContextDiffToMap, createMapFromContext } from '@geospatial-sdk/openlayers'
import { computeMapContextDiff, createViewFromLayer, updateLayerInContext } from '@geospatial-sdk/core'
import { createLegendFromLayer } from '@geospatial-sdk/legend' 
import { WmsEndpoint } from "@camptocamp/ogc-client";

let context = {
  layers: [
    {
      type: 'xyz',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    },
    {
      type: 'wms',
      url: 'https://qgisserver.hautsdefrance.fr/cgi-bin/qgis_mapserv.fcgi?MAP=/var/www/data/qgis/applications/limites_admin.qgz',
      name: 'scot_en_cours'
    }
  ],
  view: {
    extent: [1.234062, 48.826168, 4.28559, 51.089814]
  }
}
const map = createMapFromContext(context, 'map')

async function showLegend(layer) {
  const legendRoot = document.getElementById('legend-root')
  legendRoot.replaceChildren()
  const legend = await createLegendFromLayer(layer)
  if (legend) legendRoot.appendChild(legend)
}

async function switchStyle(style) {
  const newContext = updateLayerInContext(context, context.layers[1], { style })
  await applyContextDiffToMap(map, computeMapContextDiff(newContext, context))
  context = newContext
  await showLegend(context.layers[1])
}

async function loadStyles() {
  const endpoint = await new WmsEndpoint(context.layers[1].url).isReady()
  const styles = endpoint.getLayerByName(context.layers[1].name).styles.map((style) => style.name)
  
  const styleInput = document.getElementById('styles')
  for (const style of styles) {
    const option = document.createElement('option')
    option.value = style
    option.textContent = style
    styleInput.appendChild(option)
  }
  styleInput.addEventListener('input', () => switchStyle(styleInput.value))
  switchStyle(styles[0])
}

loadStyles()
`;
const html = `
<div id="map"></div>
<select id="styles"></select>
<div id="legend-root"></div>
<style>
  .layout { display: flex; height: 100%; }
  .map-area { position: relative; flex: 1; min-width: 0; }
  #map { height: 100%; }
  #styles {
    position: absolute;
    bottom: 16px;
    left: 16px;
  }
  #legend-root {
    position: absolute;
    top: 16px;
    right: 16px;
    max-width: 400px;
    max-height: 600px;
    overflow: auto;
    background: white;
    padding: 8px;
  }
</style>
`;

export const example = { name, js, html };
