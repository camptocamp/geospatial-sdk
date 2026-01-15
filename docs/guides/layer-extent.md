---
outline: deep
editLink: true
lastUpdated: true
---

# Layer Extent

This guide explains how the Geospatial SDK retrieves and manages geographic extents (bounding boxes) for different layer types.

## Overview

The geographic extent of a layer represents its bounding box in geographic coordinates (EPSG:4326). The SDK provides automated extent retrieval through the `createViewFromLayer()` function, which looks for the layer extent asynchronously in various ways depending on the layer type:

- either the service capabilities will be fetched using [`ogc-client`](https://github.com/camptocamp/ogc-client)
- or the data is parsed and analyzed in memory to compute the encompassing bounds

```typescript
import { createViewFromLayer } from "@geospatial-sdk/core";

const layer = {
  type: "wms",
  url: "https://example.com/wms",
  name: "myLayer",
};

const view = await createViewFromLayer(layer);
if (view) {
  console.log("Extent:", view.extent); // [minLon, minLat, maxLon, maxLat]
}
```

## Unsupported Layer Types

For now, only certain layer types are supported:

- WMS
- WMTS
- WFS
- GeoJSON (if the data is passed inline with the layer object)
