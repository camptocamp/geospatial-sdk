# `@geospatial-sdk/legend`

<!-- #region body -->

This package derives map legends from layer definitions in a Map Context. It is framework-agnostic: it returns data (legend URLs and entries) and leaves rendering to the consumer.

Legends are currently supported for **WMS** and **WMTS** layers.

## Installation

```sh
npm install @geospatial-sdk/legend
```

## Usage

```typescript
import {
  hasLegendSupport,
  createLegendUrlFromLayer,
  createLegendEntriesFromLayer,
  createLegendFromLayer,
} from "@geospatial-sdk/legend";
import type { MapContextLayerWms } from "@geospatial-sdk/core";

const layer: MapContextLayerWms = {
  type: "wms",
  url: "https://example.com/wms",
  name: "test-layer",
};

// Cheap, type-level guard — use it to gate UI (e.g. enable a "legend" tab).
hasLegendSupport(layer); // => true

// Resolve the raster legend graphic URL.
const url = await createLegendUrlFromLayer(layer);

// Build the list of legend entries and render them however you like.
const entries = await createLegendEntriesFromLayer(layer);
for (const entry of entries) {
  const img = document.createElement("img");
  img.src = entry.url;
  img.alt = entry.label;
  document.body.appendChild(img);
}

// DEPRECATED: build a ready-made legend element with the default CSS classes.
const legendEl = await createLegendFromLayer(layer);
if (legendEl) {
  document.body.appendChild(legendEl);
}
```

<!-- #endregion body -->

## Documentation

For more detailed API documentation, see the [documentation website](https://camptocamp.github.io/geospatial-sdk/docs/).
