# @geospatial-sdk/core

Core package of the Geospatial SDK providing data models, utilities, and abstractions for building Web GIS applications.

## Overview

The `@geospatial-sdk/core` package provides:

- **Map Context Model**: A framework-agnostic data model for describing map configurations (layers, views, styles)
- **Layer Types**: Support for WMS, WMTS, WFS, GeoJSON, XYZ, OGC API, and MapLibre Style layers
- **View Management**: Utilities for managing map views and extracting layer extents
- **Change Detection**: Diff computation for efficient map updates
- **Type Definitions**: Comprehensive TypeScript types for all geospatial entities

This package is framework-agnostic and can be used with any map library. Integration packages are available for OpenLayers (`@geospatial-sdk/openlayers`) and MapLibre GL (`@geospatial-sdk/maplibre`).

## Installation

```bash
npm install @geospatial-sdk/core
```

## Key Features

### Map Context

Define map configurations in a declarative, serializable format:

```typescript
import { MapContext, MapContextLayerWms } from '@geospatial-sdk/core';

const context: MapContext = {
  view: {
    center: [6.5, 46.5],
    zoom: 8
  },
  layers: [
    {
      type: 'wms',
      url: 'https://example.com/wms',
      name: 'layer_name',
      opacity: 0.8
    }
  ]
};
```

### Layer Extent Retrieval

Automatically extract geographic extents from layers:

```typescript
import { createViewFromLayer } from '@geospatial-sdk/core';

const layer = {
  type: 'wms',
  url: 'https://example.com/wms',
  name: 'myLayer'
};

const view = await createViewFromLayer(layer);
if (view) {
  console.log('Extent:', view.extent); // [minLon, minLat, maxLon, maxLat]
}
```

**Supported layer types for extent retrieval:**
- WMS (from GetCapabilities)
- WMTS (from GetCapabilities)
- WFS (from GetCapabilities)
- GeoJSON (computed from geometries)

📖 **[Read the full Layer Extent guide](../../docs/guides/layer-extent.md)**

### Map Context Utilities

Manage layers within a context:

```typescript
import {
  addLayerToContext,
  removeLayerFromContext,
  replaceLayerInContext,
  changeLayerPositionInContext,
  getLayerPosition
} from '@geospatial-sdk/core';

// Add a layer at a specific position
const newContext = addLayerToContext(context, newLayer, 0);

// Remove a layer by reference or ID
const updatedContext = removeLayerFromContext(context, existingLayer);

// Change layer order
const reorderedContext = changeLayerPositionInContext(context, layer, 2);
```

### Change Detection

Compute differences between contexts for efficient updates:

```typescript
import { computeMapContextDiff } from '@geospatial-sdk/core';

const diff = computeMapContextDiff(newContext, oldContext);
console.log(diff);
// {
//   layersAdded: [...],
//   layersRemoved: [...],
//   layersChanged: [...],
//   layersReordered: [...],
//   viewChanges: { ... }
// }
```

## Supported Layer Types

The SDK supports 7 layer types:

| Type | Description | Extent Support |
|------|-------------|----------------|
| **WMS** | OGC Web Map Service | ✅ Yes |
| **WMTS** | OGC Web Map Tile Service | ✅ Yes |
| **WFS** | OGC Web Feature Service | ✅ Yes |
| **GeoJSON** | Vector data in GeoJSON format | ✅ Yes |
| **XYZ** | Tile-based raster layers | ❌ No |
| **OGC API** | OGC API - Features/Tiles | ❌ No |
| **MapLibre Style** | MapLibre Style Specification | ❌ No |

## View Types

Three ways to define map views:

### By Zoom and Center

```typescript
const view = {
  center: [6.5, 46.5], // [lon, lat] in EPSG:4326
  zoom: 10
};
```

### By Extent

```typescript
const view = {
  extent: [6.0, 46.0, 7.0, 47.0] // [minLon, minLat, maxLon, maxLat]
};
```

### By Geometry

```typescript
const view = {
  geometry: {
    type: 'Polygon',
    coordinates: [[[6.0, 46.0], [7.0, 46.0], [7.0, 47.0], [6.0, 47.0], [6.0, 46.0]]]
  }
};
```

## TypeScript Support

The package is written in TypeScript and provides comprehensive type definitions:

```typescript
import type {
  MapContext,
  MapContextLayer,
  MapContextLayerWms,
  MapContextView,
  ViewByExtent,
  Extent,
  Coordinate
} from '@geospatial-sdk/core';
```

## Usage with Map Libraries

This package is framework-agnostic. Use integration packages for specific map libraries:

### With OpenLayers

```bash
npm install @geospatial-sdk/openlayers
```

```typescript
import { createMapFromContext } from '@geospatial-sdk/openlayers';

const map = await createMapFromContext(context, mapElement);
```

### With MapLibre GL

```bash
npm install @geospatial-sdk/maplibre
```

```typescript
import { createMapFromContext } from '@geospatial-sdk/maplibre';

const map = await createMapFromContext(context, mapElement);
```

## Documentation

- **[Layer Extent Retrieval Guide](../../docs/guides/layer-extent.md)** - Complete guide on extracting layer extents
- **[API Reference](../../docs/api/core/)** - Full API documentation

## Examples

See the [examples app](../../apps/examples/) for complete usage examples.

## License

See the [root LICENSE file](../../LICENSE) for license information.
