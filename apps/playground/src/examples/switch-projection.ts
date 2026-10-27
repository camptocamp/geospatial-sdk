const name = "Switching the view projection";
const js = `/**
 * - SWITCHING THE VIEW PROJECTION -
 *
 * This example shows how a map can be rendered in different projections using OpenLayers.
 *
 * Switching projection only requires changing the \`projection\` property of the context view:
 * the layers stay in the map and are reprojected on the fly. Definitions of projections
 * that are not known yet are looked up automatically.
 */

import { applyContextDiffToMap, createMapFromContext } from '@geospatial-sdk/openlayers'
import { computeMapContextDiff } from '@geospatial-sdk/core'

const PROJECTIONS = {
  'EPSG:3857': { label: 'Web Mercator', view: { center: [0, 20], zoom: 2 } },
  'EPSG:3035': { label: 'Europe (LAEA)', view: { extent: [-12, 34, 40, 72] } },
  'EPSG:5070': { label: 'USA (Conus Albers)', view: { extent: [-125, 24, -66, 50] } },
  'EPSG:3413': { label: 'Arctic (polar stereographic)', view: { center: [0, 90], zoom: 4 } },
  'EPSG:3031': { label: 'Antarctic (polar stereographic)', view: { center: [0, -90], zoom: 4 } }
} 

let context = {
  layers: [
    {
      type: 'xyz',
      label: 'satellite layer',
      url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=get_your_own_D6rA4zTHduk6KOKTXzGB'
    },
    { 
      type: 'geojson',
      url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/refs/heads/master/geojson/ne_50m_coastline.geojson'
    },
    {
      type: 'geojson',
      label: 'France regions',
      url: 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/refs/heads/master/regions.geojson',
      hoverable: true,
      clickable: false
    }
  ],
  view: { ...PROJECTIONS['EPSG:3857'].view, projection: 'EPSG:3857' }
}

const map = createMapFromContext(context, document.getElementById('map'))
const label = document.getElementById('current')
label.textContent = PROJECTIONS['EPSG:3857'].label

async function switchProjection(code) {
  const newContext = {
    ...context,
    view: { ...PROJECTIONS[code].view, projection: code }
  }
  label.textContent = 'Loading...'
  await applyContextDiffToMap(map, computeMapContextDiff(newContext, context))
  context = newContext
  label.textContent = \`\${PROJECTIONS[code].label} (\${code})\`
}

document.querySelectorAll('button[data-crs]').forEach((btn) => {
  btn.addEventListener('click', () => switchProjection(btn.dataset.crs))
})
`;

const html = `<div id="map"></div>
<div style="position: absolute; top: 16px; left: 50px; background: white; padding: 4px">
  <button type="button" data-crs="EPSG:3857">Web Mercator</button>
  <button type="button" data-crs="EPSG:3035">Europe</button>
  <button type="button" data-crs="EPSG:5070">USA</button>
  <button type="button" data-crs="EPSG:3413">Arctic</button>
  <button type="button" data-crs="EPSG:3031">Antarctic</button>
  <div>Projection: <span id="current"></span></div>
</div>
`;

export const example = { name, js, html };
