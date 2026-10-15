const name = "Listening to map events";
const js = `import { createMapFromContext, listen } from '@geospatial-sdk/openlayers'

const layers = [
  {
    type: 'wms',
    url: 'https://ows.emodnet-bathymetry.eu/wms',
    name: 'emodnet:mean_rainbowcolour'
  },
  {
    type: 'geojson',
    url: 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/refs/heads/master/regions.geojson',
    hoverable: true,
    clickable: false
  }
]
const context = {
  layers: [
    {
      type: 'xyz',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    },
    ...layers
  ],
  view: {
    zoom: 5,
    center: [6, 48.5]
  }
}

function addPanel(container, title, content) {
  const panel = document.createElement('section')
  panel.className = 'panel'
  const heading = document.createElement('strong')
  heading.textContent = title
  panel.appendChild(heading)
  if (content) panel.appendChild(content)
  container.appendChild(panel)
}

function renderFeatures(container, featuresByLayer, action) {
  container.replaceChildren()
  for (const [layerIndex, features] of featuresByLayer) {
    for (const feature of features) {
      const panel = document.createElement('section')
      panel.className = 'panel'
      const heading = document.createElement('h4')
      heading.textContent = \`\${action} feature from layer #\${layerIndex}\`
      panel.appendChild(heading)
      const list = document.createElement('ul')
      for (const [key, value] of Object.entries(feature.properties ?? {})) {
        const item = document.createElement('li')
        const label = document.createElement('strong')
        label.textContent = key
        item.append(label, document.createTextNode(\`: \${typeof value === 'object' && value !== null ? JSON.stringify(value) : value}\`))
        list.appendChild(item)
      }
      panel.appendChild(list)
      container.appendChild(panel)
    }
  }
}

const map = createMapFromContext(context, document.getElementById('map'))
const panels = document.getElementById('panels')
const hovered = document.getElementById('hovered')
const clicked = document.getElementById('clicked')

listen(map, 'features-hover', (event) => renderFeatures(hovered, event.featuresByLayer, 'Hovered'))
listen(map, 'features-click', (event) => renderFeatures(clicked, event.featuresByLayer, 'Clicked'))
listen(map, 'map-click', (event) => {
  const coordinates = document.createElement('div')
  coordinates.textContent = event.coordinate.join(', ')
  panels.querySelector('[data-click-coordinates]')?.remove()
  const panel = document.createElement('section')
  panel.className = 'panel'
  panel.dataset.clickCoordinates = ''
  const heading = document.createElement('strong')
  heading.textContent = 'Last click coordinates'
  panel.append(heading, coordinates)
  panels.prepend(panel)
})
listen(map, 'map-extent-change', (event) => {
  let panel = panels.querySelector('[data-extent]')
  if (!panel) {
    panel = document.createElement('section')
    panel.className = 'panel'
    panel.dataset.extent = ''
    panels.prepend(panel)
  }
  panel.replaceChildren()
  const heading = document.createElement('h4')
  heading.textContent = 'Map Extent'
  panel.appendChild(heading)
  const list = document.createElement('ul')
  for (const [label, value] of ['Min X', 'Min Y', 'Max X', 'Max Y'].map((label, index) => [label, event.extent[index]])) {
    const item = document.createElement('li')
    const strong = document.createElement('strong')
    strong.textContent = label
    item.append(strong, document.createTextNode(\`: \${value}\`))
    list.appendChild(item)
  }
  panel.appendChild(list)
})
`;
const html = `<div id="map"></div>
<div id="panels">
  <div id="hovered"></div>
  <div id="clicked"></div>
</div>
<style>
  #panels { position: absolute; top: 12px; right: 12px; z-index: 2; display: flex; flex-direction: column; gap: 12px; width: 224px; max-height: calc(100% - 24px); overflow: auto; }
  .panel { padding: 12px; border-radius: 4px; background: white; box-shadow: 0 1px 4px #0003; overflow-wrap: anywhere; }
  .panel h4 { margin: 0 0 4px; font-weight: 700; }
  .panel ul { margin: 4px 0 0; padding-left: 20px; }
</style>
`;

export const example = { name, js, html };
