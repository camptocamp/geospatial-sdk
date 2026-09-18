const name = "Querying geocoding providers";
const js = `/**
 * - QUERYING GEOCODING PROVIDERS -
 * 
 * This example demonstrates how to query different geocoding providers
 * using the SDK.
 */

import {
  queryGeoplateforme,
  queryGeoadmin,
  queryGeonames
} from '@geospatial-sdk/geocoding'

let provider = 'geonames';
let searchText = '';

function selectProvider(value) {
  provider = value;
  queryResults().then(updateResults);
}

async function queryResults() {
  if (searchText.length < 3) {
    return [];
  }
  switch (provider) {
    case 'geoadmin':
      return await queryGeoadmin(searchText);
    case 'geoplateforme':
      return await queryGeoplateforme(searchText);
    case 'geonames':
    default:
      return await queryGeonames(searchText);
  }
}

function updateResults(results) {
  const span = document.getElementById('results-count')
  span.textContent = results.length.toString();
  const list = document.getElementById('results-list')
  list.innerHTML = ''
  results.forEach((result) => {
    const li = document.createElement('li');
    li.textContent = result.label;
    list.appendChild(li)
  })
}

document.getElementById('search-input').addEventListener('input', (event) => {
  searchText = event.target.value
  queryResults().then(updateResults)
});

document.querySelectorAll('.provider-btn').forEach((button) => {
  button.addEventListener('click', (event) => {
    provider = event.target.dataset.provider;
    queryResults().then(updateResults);
  });
});
`;
const html = `<div style="padding: 12px">
  <p style="margin-bottom: 12px;">
    Choose one of the supported providers and write something to trigger a search.
  </p>
  <div style="display: flex; flex-direction: row; gap: 10px; margin-bottom: 12px;">
    <input type="text" placeholder="Type something here!" id="search-input" />
    <button type="button" class="provider-btn" data-provider="geonames">Geonames</button>
    <button type="button" class="provider-btn" data-provider="geoadmin">Geoadmin (CH)</button>
    <button type="button" class="provider-btn" data-provider="geoplateforme">Géoplateforme (FR)</button>
  </div>
  <p><span id="results-count">0</span> results found.</p>
  <ul id="results-list"></ul>
</div>
`;

export const example = { name, js, html };
