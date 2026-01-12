# Layer Extent Retrieval

This guide explains how the Geospatial SDK retrieves and manages geographic extents (bounding boxes) for different layer types.

## Overview

The geographic extent of a layer represents its bounding box in geographic coordinates. The SDK provides automated extent retrieval through the `createViewFromLayer()` function, which:

- Fetches metadata from OGC services (WMS, WMTS, WFS)
- Computes extents from geometry data (GeoJSON)
- Ensures all extents are normalized to **EPSG:4326** (longitude/latitude)
- Returns a `ViewByExtent` object that can be used to position the map view

## Core Function: `createViewFromLayer()`

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

### Return Value

- **Success**: Returns a `ViewByExtent` object with an `extent` property `[minX, minY, maxX, maxY]` in EPSG:4326
- **No extent available**: Returns `null` if the layer has no bounding box metadata
- **Unsupported layer type**: Throws an error

## Extent Format

All extents follow the OpenLayers extent format:

```typescript
type Extent = [number, number, number, number];
// [minX, minY, maxX, maxY]
// or equivalently: [west, south, east, north]
```

**Coordinate System**: All extents are expressed in **EPSG:4326** (WGS84 longitude/latitude):

- X-axis: Longitude (west to east, -180° to 180°)
- Y-axis: Latitude (south to north, -90° to 90°)

## Supported Layer Types

### WMS Layers

**How it works:**

1. Fetches the WMS GetCapabilities document
2. Extracts `BoundingBox` elements from the layer metadata
3. Prefers longitude/latitude CRS (EPSG:4326, CRS:84)
4. Falls back to transforming other CRS using proj4

**Example:**

```typescript
const wmsLayer = {
  type: "wms",
  url: "https://data.geopf.fr/wms-r/wms",
  name: "CADASTRALPARCELS.HEATMAP",
};

const view = await createViewFromLayer(wmsLayer);
// Returns: { extent: [minLon, minLat, maxLon, maxLat] }
```

**CRS Preference:**

- ✅ First choice: EPSG:4326, CRS:84, or other lon/lat codes
- ⚙️ Fallback: Transforms first available CRS to EPSG:4326 using proj4
- ❌ Returns `null` if no bounding box is defined

### WMTS Layers

**How it works:**

1. Fetches the WMTS GetCapabilities document
2. Extracts the `WGS84BoundingBox` element
3. Returns the extent directly (already in EPSG:4326)

**Example:**

```typescript
const wmtsLayer = {
  type: "wmts",
  url: "https://example.com/wmts/WMTSCapabilities.xml",
  name: "satellite",
};

const view = await createViewFromLayer(wmtsLayer);
// Returns: { extent: [minLon, minLat, maxLon, maxLat] }
```

**Notes:**

- If capabilities contain only one layer, it's used automatically
- Otherwise, uses `layer.name` to look up the layer
- Returns `null` if no `latLonBoundingBox` is defined

### GeoJSON Layers

**How it works:**

1. Parses the GeoJSON data (string or object)
2. Iterates through all features
3. Computes the combined extent by extending the bounding box for each geometry
4. Features without geometries are ignored

**Example:**

```typescript
const geojsonLayer = {
  type: "geojson",
  data: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [2.3, 48.8] },
        properties: {},
      },
    ],
  },
};

const view = await createViewFromLayer(geojsonLayer);
// Returns: { extent: [2.3, 48.8, 2.3, 48.8] }
```

**Notes:**

- Works with both inline `data` (FeatureCollection or JSON string) and URL-based layers
- Uses OpenLayers GeoJSON reader for robust parsing
- Empty FeatureCollections will produce an empty extent

### WFS Layers

**How it works:**

1. Fetches the WFS GetCapabilities document
2. Looks up the feature type summary
3. Extracts the `boundingBox` property
4. Returns the extent (typically in EPSG:4326)

**Example:**

```typescript
const wfsLayer = {
  type: "wfs",
  url: "https://example.com/wfs",
  featureType: "buildings",
};

const view = await createViewFromLayer(wfsLayer);
// Returns: { extent: [minLon, minLat, maxLon, maxLat] }
```

**Notes:**

- WFS specifications require bounding boxes in WGS84 (EPSG:4326)
- Returns `null` if the feature type is not found or has no bounding box

## Unsupported Layer Types

The following layer types **do not support** extent retrieval and will throw an error:

- ❌ **XYZ** (tile-based layers) - No extent metadata available
- ❌ **OGC API** - Not yet implemented
- ❌ **MapLibre Style** - Style documents don't contain extent information

**Error message:**

```
Error: Unsupported layer type: xyz
```

## Coordinate Transformations

### Projection Handling

The SDK handles coordinate system transformations automatically:

1. **Input CRS**: Layer metadata may provide extents in various CRS
2. **Transformation**: proj4 + OpenLayers convert to EPSG:4326
3. **Output CRS**: All extents are returned in EPSG:4326

### Transformation Process (WMS Example)

```typescript
// Layer metadata provides extent in EPSG:2154 (Lambert 93)
boundingBox = [650796.4, 7060330.6, 690891.3, 7090402.2];

// SDK transforms to EPSG:4326
extent = transformExtent(boundingBox, "EPSG:2154", "EPSG:4326");
// Result: [2.3, 50.6, 2.8, 50.9] (lon/lat)
```

### Map Integration

When creating a map view, extents are transformed again to match the map projection:

```typescript
import { createMapFromContext } from '@geospatial-sdk/openlayers';

const context = {
  view: { extent: [2.3, 50.6, 2.8, 50.9] }, // EPSG:4326
  layers: [...]
};

// OpenLayers transforms EPSG:4326 → EPSG:3857 (Web Mercator) internally
const map = await createMapFromContext(context, mapElement);
```

## Using Extents to Control Map View

### Zoom to Layer Extent

```typescript
import {
  createViewFromLayer,
  computeMapContextDiff,
  type MapContext,
} from "@geospatial-sdk/core";
import { applyContextDiffToMap } from "@geospatial-sdk/openlayers";

async function zoomToLayer(layer) {
  const newView = await createViewFromLayer(layer);

  if (newView === null) {
    console.warn("Layer has no extent");
    return;
  }

  const newContext: MapContext = {
    ...currentContext,
    view: newView,
  };

  const diff = computeMapContextDiff(newContext, currentContext);
  await applyContextDiffToMap(map, diff);
}
```

### Initial Map View

```typescript
import { createMapFromContext } from "@geospatial-sdk/openlayers";

const layer = {
  type: "wms",
  url: "https://example.com/wms",
  name: "myLayer",
};

const view = await createViewFromLayer(layer);

const context = {
  view, // Set initial view from layer extent
  layers: [layer],
};

const map = await createMapFromContext(context, mapElement);
```

## Error Handling

### No Extent Available

```typescript
const view = await createViewFromLayer(layer);

if (view === null) {
  console.warn("Layer has no extent metadata");
  // Use a default view or handle gracefully
}
```

### Unsupported Layer Type

```typescript
try {
  const view = await createViewFromLayer(xyzLayer);
} catch (error) {
  console.error("Cannot extract extent:", error.message);
  // Error: Unsupported layer type: xyz
}
```

### Service Unavailable

```typescript
try {
  const view = await createViewFromLayer(wmsLayer);
} catch (error) {
  console.error("Failed to fetch capabilities:", error);
  // Handle network or parsing errors
}
```

## Best Practices

### 1. Check for Null Returns

Always handle the case where extent retrieval returns `null`:

```typescript
const view = await createViewFromLayer(layer);
if (!view) {
  // Provide fallback extent or skip zoom
  return;
}
```

### 2. Combine Multiple Layer Extents

To zoom to the combined extent of multiple layers:

```typescript
import { extend } from "ol/extent";

const extents = await Promise.all(
  layers.map((layer) => createViewFromLayer(layer)),
);

const combinedExtent = extents
  .filter((view) => view !== null)
  .map((view) => view.extent)
  .reduce((prev, curr) => extend(prev, curr));

const view = { extent: combinedExtent };
```

### 3. Cache Extent Results

Extent retrieval requires fetching service capabilities. Consider caching results:

```typescript
const extentCache = new Map();

async function getLayerExtentCached(layer) {
  const cacheKey = `${layer.type}-${layer.url}-${layer.name || ""}`;

  if (!extentCache.has(cacheKey)) {
    const view = await createViewFromLayer(layer);
    extentCache.set(cacheKey, view);
  }

  return extentCache.get(cacheKey);
}
```

## API Reference

For detailed API documentation, see:

- [`createViewFromLayer()`](/api/core/lib/functions/createViewFromLayer)
- [`ViewByExtent`](/api/core/lib/interfaces/ViewByExtent)
- [`Extent`](/api/core/lib/type-aliases/Extent)
- [`MapContextLayer`](/api/core/lib/interfaces/MapContextLayer)

## Related Topics

Additional guides to be created:

- Map Context Management
- View Management
- Layer Types
